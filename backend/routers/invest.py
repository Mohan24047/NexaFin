from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from ..db import database, models
from ..auth import utils as services

router = APIRouter(
    prefix="/invest",
    tags=["invest"]
)

class ConnectRequest(BaseModel):
    startupId: str
    message: Optional[str] = None

class ConnectionResponse(BaseModel):
    success: bool
    message: str

@router.post("/connect", response_model=ConnectionResponse)
def connect_startup(
    req: ConnectRequest,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(services.get_current_user)
):
    try:
        print(f"--- CONNECT START ---")
        print(f"User: {current_user.email} (ID: {current_user.id})")
        print(f"Target Startup ID: {req.startupId}")
        
        # 1. Check duplicate
        existing = db.query(models.InvestmentRequest).filter(
            models.InvestmentRequest.investor_user_id == current_user.id,
            models.InvestmentRequest.startup_id == req.startupId,
            models.InvestmentRequest.status == "pending"
        ).first()
        
        if existing:
            print(f"DUPLICATE FOUND! Existing Request ID: {existing.id}")
            print(f"  - Startup ID: {existing.startup_id}")
            print(f"  - Investor ID: {existing.investor_user_id}")
            return {"success": False, "message": "Request already sent"}
        else:
            print("No duplicate found. Proceeding...")

        # 2. Identify Target Startup and Owner
        # Check against Startup Table first (Project)
        startup_project = db.query(models.Startup).filter(models.Startup.id == req.startupId).first()
        
        target_name = "Unknown Startup"
        target_owner_email = ""
        target_user_id = None
        
        if startup_project:
            target_name = startup_project.name
            target_owner_email = startup_project.creator_email
            # Find user ID from email
            owner_user = db.query(models.User).filter(models.User.email == target_owner_email).first()
            if owner_user:
                target_user_id = owner_user.id
            else:
                # Fallback if owner user deleted but startup exists? Unlikely.
                target_user_id = req.startupId
        else:
             # Fallback to User ID match (legacy behavior)
             target_user = db.query(models.User).filter(models.User.id == req.startupId).first()
             if target_user:
                 target_user_id = target_user.id
                 target_owner_email = target_user.email
                 target_name = "Startup Profile"

        print(f"TARGET IDENTIFIED: Name={target_name}, OwnerEmail={target_owner_email}, UserID={target_user_id}")

        # 3. Create Record
        new_request = models.InvestmentRequest(
            investor_user_id=current_user.id,
            startup_user_id=target_user_id,
            startup_id=req.startupId,
            startup_name=target_name,
            startup_owner=target_owner_email,
            message=req.message,
            status="pending",
            is_read=False
        )
        
        db.add(new_request)
        db.commit()
        db.refresh(new_request)
        
        print("DB INSERT RESULT:", new_request.id, new_request.status)
        
        # 4. NO EMAIL - Internal Messaging Only
        
        return {"success": True, "message": "Request sent to startup dashboard"}

    except Exception as e:
        print(f"CONNECT ERROR: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "message": f"Server error: {str(e)}"}

@router.get("/requests")
def get_my_requests(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(services.get_current_user)
):
    # Get requests sent TO this user (as a startup)
    # Eager load investor to get details
    requests = db.query(models.InvestmentRequest).options(
        joinedload(models.InvestmentRequest.investor)
    ).filter(
        models.InvestmentRequest.startup_user_id == current_user.id
    ).order_by(models.InvestmentRequest.created_at.desc()).all()
    
    # Map to response format including investor info
    return [
        {
            "id": r.id,
            "investor_name": r.investor.email.split('@')[0] if r.investor else "Unknown Investor",
            "investor_email": r.investor.email if r.investor else "Hidden",
            "message": r.message,
            "status": r.status,
            "is_read": r.is_read,
            "created_at": r.created_at
        }
        for r in requests
    ]

@router.post("/read/{request_id}")
def mark_as_read(
    request_id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(services.get_current_user)
):
    req = db.query(models.InvestmentRequest).filter(
        models.InvestmentRequest.id == request_id,
        models.InvestmentRequest.startup_user_id == current_user.id
    ).first()
    
    if req:
        req.is_read = True
        db.commit()
    
    return {"success": True}

@router.get("/startup/requests")
def get_startup_requests(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(services.get_current_user)
):
    # Ensure user is a startup (optional strict check, or just filter by ID)
    # We filter by startup_user_id == current_user.id
    
    print(f"DEBUG STARTUP FETCH: User {current_user.email} requesting dashboard.")

    # Filter by startup_owner matching current_user.email OR startup_user_id matching current_user.id
    # This covers both email-based and ID-based linking
    from sqlalchemy import or_
    
    requests = db.query(models.InvestmentRequest).options(
        joinedload(models.InvestmentRequest.investor)
    ).filter(
        or_(
            models.InvestmentRequest.startup_owner == current_user.email,
            models.InvestmentRequest.startup_user_id == current_user.id
        )
    ).order_by(models.InvestmentRequest.created_at.desc()).all()
    
    print(f"DEBUG STARTUP FETCH: Found {len(requests)} requests for {current_user.email} (ID: {current_user.id})")
    
    return [
        {
            "id": r.id,
            "senderEmail": r.investor.email if r.investor else "Unknown",
            "message": r.message,
            "startupName": r.startup_name or "Unknown Startup",
            "status": r.status,
            "createdAt": r.created_at
        }
        for r in requests
    ]

class UpdateRequestStatus(BaseModel):
    id: str
    action: str # "accept" | "reject"

@router.post("/startup/requests/update")
def update_request_status(
    req: UpdateRequestStatus,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(services.get_current_user)
):
    # 1. Find request belonging to this startup
    request_record = db.query(models.InvestmentRequest).filter(
        models.InvestmentRequest.id == req.id,
        models.InvestmentRequest.startup_user_id == current_user.id
    ).first()
    
    if not request_record:
        raise HTTPException(status_code=404, detail="Request not found or unauthorized")
        
    # 2. Update status
    if req.action == "accept":
        request_record.status = "accepted"
    elif req.action == "reject":
        request_record.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    db.commit()

    # 3. Create in-app notification for the investor on accept
    if req.action == "accept" and request_record.investor:
        notif = models.Notification(
            receiver_email=request_record.investor.email,
            type="investor_request_accepted",
            message=f"Your investment request for {request_record.startup_name or 'a startup'} was accepted."
        )
        db.add(notif)
        db.commit()
    
    return {"success": True, "message": f"Request {request_record.status}"}
