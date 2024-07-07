import json
from datetime import date, datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends

from app.schemas import (UserCreate, UserOut,
                         UserChangePasswordIn, 
                         UserBaseSendConfirmCode, UserBaseConfirmCode, UserBaseConfirmed,
                         UserBaseResetLetterSent, UserBaseResetLetterIn, UserBaseResetConfirm, UserBaseResetConfirmed,
                         UserBaseResetPasswordIn, UserBaseResetPasswordOut,
                         UserBaseChangeEmailIn)
from app.models import User
from app.utils import password
from app.utils.contrib import decode_jwt
from app.utils.email import send_confirmation_letter
from app.utils.redis import r, get_pipe
from app import settings

#TODO write a description for all the routes

router = APIRouter()


@router.post("/", response_model=UserOut, status_code=201)
async def create_user(
    user_in: UserCreate,
):
    user = await User.get_by_email(email=user_in.email)

    if user is not None:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists"
        )
    
    db_user = await User.create(user_in)
    return db_user


@router.get("/me/home", response_model=UserOut, status_code=200) # response_model=UserOut
async def get_user_me(
    current_user: User = Depends(decode_jwt)
):
    return current_user


@router.post("/me/change_password", status_code=200)
async def change_password(
    change_password_in: UserChangePasswordIn,
    current_user: User = Depends(decode_jwt)
):
    verified, updated_password_hash = password.verify_and_update_password(change_password_in.current_password, 
                                                                          current_user.password_hash)
    if not verified:
        raise HTTPException(
            status_code=401,
            detail="Entered current password is incorrect"
        )

    current_user.password_hash = password.get_password_hash(change_password_in.new_password)
    await current_user.save()


@router.get("/me/send_confirm_code", response_model=UserBaseSendConfirmCode, status_code=200)
async def send_email_confirm_code(
    current_user: User = Depends(decode_jwt)
):
    if current_user.is_confirmed:
        raise HTTPException(
            status_code=422,
            detail="The user already confirmed email"
        )
    
    await send_confirmation_letter(to=current_user.email,
                                   user_id=current_user.uuid,
                                   subject="The email confirmation code",
                                   text="Your email confirmation code",
                                   confirmation_type="confirmation")
    
    out = UserBaseSendConfirmCode(user_id=current_user.uuid, email=current_user.email, time=datetime.now())
    return out


#TODO decompose this shit idiot
@router.post("/me/confirm_email", response_model=UserBaseConfirmed, status_code=200)
async def confirm_email_code(
    confirm_in: UserBaseConfirmCode,
    current_user: User = Depends(decode_jwt)
):
    async with r.pipeline(transaction=True) as pipe:
        code_field = (await (pipe.hgetall(
            f"{current_user.uuid}:confirmation"
        ).execute()))[0]

        if code_field == {}:
            raise HTTPException(
                status_code=404,
                detail="The confirmation code did not been sent"
            )
        
        if code_field["code"] != confirm_in.code:
            raise HTTPException(
                status_code=422,
                detail="Incorrect confirmation code"
            )
        
        if code_field["email"] != current_user.email:
            raise HTTPException(
                status_code=422,
                detail="Incorrect email"
            )
        
        if datetime.now() - datetime.strptime(code_field["time"], '%Y-%m-%d %H:%M:%S.%f') > timedelta(seconds=settings.EMAIL_CONFIRMATION_CODE_EXPIRE_DELTA):
            raise HTTPException(
                status_code=410,
                detail="Confirmation code has been expired"
            )

        await (pipe.delete(f"{current_user.uuid}:confirmation").execute())
        
        current_user.is_confirmed = True
        await current_user.save()

        return UserBaseConfirmed(user_id=current_user.uuid, 
                                 email=current_user.email, 
                                 is_comfirmed=current_user.is_confirmed)
    

@router.post("/password_reset/send", response_model=UserBaseResetLetterSent, status_code=200)
async def password_reset_letter(
    letter_in: UserBaseResetLetterIn
):
    user = await User.get_by_email(email=letter_in.email)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist"
        )
    
    await send_confirmation_letter(to=user.email,
                                   user_id=user.uuid,
                                   subject="Password reset code",
                                   text="Your password reset code",
                                   confirmation_type="reset_password")
    
    return UserBaseResetLetterSent(email=user.email, time=datetime.now())


@router.post("/password_reset/confirm", response_model=UserBaseResetConfirmed, status_code=200)
async def password_reset_confirm(
    confirm_in: UserBaseResetConfirm
):
    user = await User.get_by_email(confirm_in.email)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist"
        )
    
    async with r.pipeline(transaction=True) as pipe:
        code_field = (await (pipe.hgetall(
            f"{user.uuid}:reset_password"
        ).execute()))[0]

        if code_field == {}:
            raise HTTPException(
                status_code=404,
                detail="Confirmation code did not been sent"
            )

        if code_field["code"] != confirm_in.code:
            raise HTTPException(
                status_code=422,
                detail="Incorrect confirmation code"
            )
        
        if code_field["email"] != confirm_in.email:
            raise HTTPException(
                status_code=422,
                detail="Incorrect email"
            )
        
        if code_field["status"] != "sent":
            raise HTTPException(
                status_code=422,
                detail="The password reset letter had not been sent"
            )
        
        if datetime.now() - datetime.strptime(code_field["time"], '%Y-%m-%d %H:%M:%S.%f') > timedelta(seconds=settings.EMAIL_CONFIRMATION_CODE_EXPIRE_DELTA):
            raise HTTPException(
                status_code=410,
                detail="Confirmation code has been expired"
            )
        
        await (pipe.hset(
                f"{user.uuid}:reset_password",
                mapping={
                    "status": "confirmed"
            }).execute()
        )

    return UserBaseResetConfirmed(email=user.email)


@router.post("/password_reset/set_new", response_model=UserBaseResetPasswordOut, status_code=200)
async def reset_new_password(
    reset_in: UserBaseResetPasswordIn
):
    user = await User.get_by_email(reset_in.email)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist"
        )
    

    async with r.pipeline(transaction=True) as pipe:
        code_field = (await (pipe.hgetall(
            f"{user.uuid}:reset_password"
        ).execute()))[0]

        if code_field == {}:
            raise HTTPException(
                status_code=404,
                detail="Confirmation code did not been sent"
            )
        
        if code_field["status"] != "confirmed":
            raise HTTPException(
                status_code=422,
                detail="The password reset letter had not been confirmed"
            )

        hashed_password = password.get_password_hash(reset_in.password)

        user.password_hash = hashed_password
        await user.save()

        await (pipe.delete(f"{user.uuid}:reset_password").execute())

        return UserBaseResetPasswordOut(user_id=user.uuid)
    

@router.post("/me/change_email/send", response_model=UserBaseSendConfirmCode, status_code=200,
             description="Send confirmation code to new email")
async def send_change_email_code(
    data_in: UserBaseChangeEmailIn,
    current_user: User = Depends(decode_jwt)
):
    if not current_user.is_confirmed:
        raise HTTPException(
            status_code=403,
            detail="The current email of this user is not confirmed"
        )

    await send_confirmation_letter(to=data_in.email,
                                   user_id=current_user.uuid,
                                   subject="Email change confirmation code",
                                   text="Your new email confirmation code",
                                   confirmation_type="change")
    
    out = UserBaseSendConfirmCode(user_id=current_user.uuid, email=data_in.email, time=datetime.now())
    return out


@router.post("/me/change_email/confirm", response_model=UserBaseConfirmed, status_code=200,
             description="Confirm new email with confirmation code")
async def confirm_new_email(
    data_in: UserBaseConfirmCode,
    current_user: User = Depends(decode_jwt)
):
    async with r.pipeline(transaction=True) as pipe:
        code_field = (await (pipe.hgetall(
            f"{current_user.uuid}:change"
        ).execute()))[0]

        if code_field == {}:
            raise HTTPException(
                status_code=404,
                detail="The confirmation code did not been sent"
            )
        
        if code_field["code"] != data_in.code:
            raise HTTPException(
                status_code=422,
                detail="Incorrect confirmation code"
            )
        
        if datetime.now() - datetime.strptime(code_field["time"], '%Y-%m-%d %H:%M:%S.%f') > timedelta(seconds=settings.EMAIL_CONFIRMATION_CODE_EXPIRE_DELTA):
            raise HTTPException(
                status_code=410,
                detail="Confirmation code has been expired"
            )

        await (pipe.delete(f"{current_user.uuid}:change").execute())
        
        current_user.email = code_field["email"]
        current_user.is_confirmed = True
        await current_user.save()

        return UserBaseConfirmed(user_id=current_user.uuid, 
                                 email=current_user.email, 
                                 is_comfirmed=current_user.is_confirmed)