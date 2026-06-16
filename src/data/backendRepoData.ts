export interface RepoFile {
  path: string;
  name: string;
  language: string;
  description: string;
  content: string;
}

export interface RepoModule {
  id: string;
  title: string;
  folder: string;
  description: string;
  topic: string;
  files: RepoFile[];
}

export const BACKEND_REPO_DATA: RepoModule[] = [
  {
    id: "01-rest-api",
    title: "REST API Development",
    folder: "01-rest-api",
    topic: "FastAPI + PostgreSQL + SQLAlchemy + Alembic",
    description: "Production-ready REST API implementing standard CRUD, database migrations with Alembic, asynchronous core handlers, and strict schema validation.",
    files: [
      {
        path: "01-rest-api/README.md",
        name: "README.md",
        language: "markdown",
        description: "Module layout and configuration instructions",
        content: `# FastAPI REST API with SQL Alchemy & Alembic

This module implements a production-ready asynchronous CRUD REST API using **FastAPI**, backed by a **PostgreSQL** relational database. It utilizes **SQLAlchemy 2.0** (ORM) and **Alembic** for automated database schema migrations.

## Technical Architecture Overview
- **FastAPI**: Modern, fast web framework with absolute automatic documentation (Swagger UI/ReDoc) and type checks.
- **SQLAlchemy 2.0 (Async)**: Modern ORM configuration with async database session pooling via \`asyncpg\`.
- **Alembic**: Database migrations directory designed for tracking and applying schema mutations securely.
- **Pydantic v2**: Secure schema validation engines defining custom serializers and validation boundaries.

## Quick Start Setup
1. Copy \`.env.example\` to \`.env\` and fill out the database credentials.
2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
3. Run migrations to initialize the PostgreSQL schema:
   \`\`\`bash
   alembic upgrade head
   \`\`\`
4. Spin up the local development web server:
   \`\`\`bash
   uvicorn app.main:app --reload --port 8000
   \`\`\`
`
      },
      {
        path: "01-rest-api/requirements.txt",
        name: "requirements.txt",
        language: "text",
        description: "Python module dependencies",
        content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
sqlalchemy[asyncio]>=2.0.28
asyncpg>=0.29.0
alembic>=1.13.1
pydantic[email]>=2.6.4
python-dotenv>=1.0.1
`
      },
      {
        path: "01-rest-api/.env.example",
        name: ".env.example",
        language: "env",
        description: "Environment secrets template",
        content: `DATABASE_URL="postgresql+asyncpg://postgres:postgres@localhost:5432/backend_db"
ENV="development"
PORT=8000
`
      },
      {
        path: "01-rest-api/app/config.py",
        name: "config.py",
        language: "python",
        description: "Pydantic BaseSettings class mapping configuration from variables",
        content: `import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    App configuration managed securely via environment variables.
    Supports local .env loading for fast development override.
    """
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/backend_db"
    ENV: str = "development"
    PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
`
      },
      {
        path: "01-rest-api/app/database.py",
        name: "database.py",
        language: "python",
        description: "SQLAlchemy async engine setup and DB session generator utility",
        content: `from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

# Create highly optimized asynchronous database connection engine
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
    echo=settings.ENV == "development"
)

# Async DB session pool generator
async_session_pool = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

class Base(DeclarativeBase):
    """
    Unified database base class serving as standard SQLAlchemy registry
    for declarative mapping.
    """
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency generator yielding safe database sessions to the requests.
    Guarantees strict connection teardown, transaction hygiene, and pooling.
    """
    db_session = async_session_pool()
    try:
        yield db_session
    finally:
        await db_session.close()
`
      },
      {
        path: "01-rest-api/app/models.py",
        name: "models.py",
        language: "python",
        description: "SQLAlchemy database tables definitions",
        content: `from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class User(Base):
    """
    User database model. One-to-many relationship with Item.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # One-to-many relationship mapping
    items: Mapped[list["Item"]] = relationship(
        "Item",
        back_populates="owner",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

class Item(Base):
    """
    Item database model representing user-owned catalog items.
    """
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Back-populates user connection
    owner: Mapped[User] = relationship("User", back_populates="items")
`
      },
      {
        path: "01-rest-api/app/schemas.py",
        name: "schemas.py",
        language: "python",
        description: "Pydantic validator schemas matching models",
        content: `from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict

class ItemBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=100, examples=["Project Notebook"])
    description: str | None = Field(None, max_length=1000, examples=["Standard item notebook description"])

class ItemCreate(ItemBase):
    pass

class ItemResponse(ItemBase):
    id: int
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    email: EmailStr = Field(..., examples=["jane.doe@example.com"])
    username: str = Field(..., min_length=3, max_length=50, pattern="^[a-zA-Z0-9_-]+$", examples=["janedoe"])

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    items: list[ItemResponse] = []

    model_config = ConfigDict(from_attributes=True)
`
      },
      {
        path: "01-rest-api/app/crud.py",
        name: "crud.py",
        language: "python",
        description: "Optimized database transactions (CRUD operations)",
        content: `from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User, Item
from app.schemas import UserCreate, ItemCreate

async def get_user_by_id(db: AsyncSession, user_id: int) -> User | None:
    """
    Retrieve user record by unique ID using standard select queries.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()

async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """
    Retrieve user record matching registered email.
    """
    result = await db.execute(select(User).where(User.email == email))
    return result.scalars().first()

async def get_users(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[User]:
    """
    Paginated batch query extraction for User profiles.
    """
    result = await db.execute(select(User).offset(skip).limit(limit))
    return list(result.scalars().all())

async def create_user(db: AsyncSession, user_data: UserCreate) -> User:
    """
    Create and commit a new User database entry.
    """
    new_user = User(
        email=user_data.email,
        username=user_data.username
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def get_items(db: AsyncSession, skip: int = 0, limit: int = 100) -> list[Item]:
    """
    Paginated list retrieval of general items.
    """
    result = await db.execute(select(Item).offset(skip).limit(limit))
    return list(result.scalars().all())

async def create_user_item(db: AsyncSession, item_data: ItemCreate, user_id: int) -> Item:
    """
    Sub-resource injection: bind item instance directly to designated user_id.
    """
    new_item = Item(
        title=item_data.title,
        description=item_data.description,
        owner_id=user_id
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item

async def delete_item(db: AsyncSession, item_id: int) -> bool:
    """
    Delete item and commit database record update.
    """
    result = await db.execute(select(Item).where(Item.id == item_id))
    item_ref = result.scalars().first()
    if not item_ref:
        return False
    await db.delete(item_ref)
    await db.commit()
    return True
`
      },
      {
        path: "01-rest-api/app/main.py",
        name: "main.py",
        language: "python",
        description: "Application engine entry point linking routing handlers",
        content: `from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas import UserResponse, UserCreate, ItemResponse, ItemCreate
from app import crud

app = FastAPI(
    title="REST API Engine",
    description="Asynchronous CRUD API backend powered by FastAPI & PostgreSQL",
    version="1.0.0"
)

@app.get("/health", tags=["Status"])
async def check_health():
    """
    System diagnostic endpoint verifying API operability.
    """
    return {"status": "healthy", "service": "rest-api-engine"}

@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
async def create_user(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new user account profile. Verifies email uniqueness.
    """
    existing_user = await crud.get_user_by_email(db, email=user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    return await crud.create_user(db, user_data=user_data)

@app.get("/users", response_model=list[UserResponse], tags=["Users"])
async def get_all_users(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """
    Query the paginated directory listing of all users.
    """
    return await crud.get_users(db, skip=skip, limit=limit)

@app.get("/users/{user_id}", response_model=UserResponse, tags=["Users"])
async def get_user_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    """
    Retrieve single user record with all associated nested items.
    """
    user_ref = await crud.get_user_by_id(db, user_id=user_id)
    if not user_ref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} was not found"
        )
    return user_ref

@app.post("/users/{user_id}/items", response_model=ItemResponse, status_code=status.HTTP_201_CREATED, tags=["Items"])
async def add_item_to_user(user_id: int, item_data: ItemCreate, db: AsyncSession = Depends(get_db)):
    """
    Create and bind an item to a parent user account.
    """
    user_ref = await crud.get_user_by_id(db, user_id=user_id)
    if not user_ref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent user not found"
        )
    return await crud.create_user_item(db, item_data=item_data, user_id=user_id)

@app.get("/items", response_model=list[ItemResponse], tags=["Items"])
async def get_all_items(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """
    General catalog items querying.
    """
    return await crud.get_items(db, skip=skip, limit=limit)

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Items"])
async def remove_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """
    Permanently delete an item from the database.
    """
    deleted = await crud.delete_item(db, item_id=item_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with ID {item_id} did not exist"
        )
    return None
`
      },
      {
        path: "01-rest-api/alembic.ini",
        name: "alembic.ini",
        language: "ini",
        description: "Alembic framework settings file",
        content: `[alembic]
script_location = alembic
prepend_sys_path = .
version_locations = %(here)s/alembic/versions

[logging]
default_level = INFO
`
      },
      {
        path: "01-rest-api/alembic/env.py",
        name: "env.py",
        language: "python",
        description: "Alembic setup connecting metadata to schema migrations engine",
        content: `import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context

# Setup database target metadata mapping
from app.database import Base
from app.config import settings
target_metadata = Base.metadata

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode with async connection."""
    connectable = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
`
      },
      {
        path: "01-rest-api/alembic/versions/3a2b1c_initial_migration.py",
        name: "3a2b1c_initial_migration.py",
        language: "python",
        description: "First migration script building users and items tables",
        content: `"""initial migration

Revision ID: 3a2b1c_initial_migration
Revises: 
Create Date: 2026-06-10 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision: str = '3a2b1c_initial_migration'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create table 'users'
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # 2. Create table 'items'
    op.create_table(
        'items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_items_id'), 'items', ['id'], unique=False)
    op.create_index(op.f('ix_items_title'), 'items', ['title'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_items_title'), table_name='items')
    op.drop_index(op.f('ix_items_id'), table_name='items')
    op.drop_table('items')
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
`
      }
    ]
  },
  {
    id: "02-auth",
    title: "JWT Authentication & RBAC",
    folder: "02-auth",
    topic: "JSON Web Tokens + Cryptographic Passwords + Access Control",
    description: "Secure security core supplying dual-token login (Access + Refresh tokens), password salting (bcrypt), token rotation, and Role-Based Access Control (RBAC).",
    files: [
      {
        path: "02-auth/README.md",
        name: "README.md",
        language: "markdown",
        description: "Auth setup and design guidelines",
        content: `# JWT Authentication and Role-Based Access Control (RBAC)

This module implements a complete, industrial-strength authentication interface inside **FastAPI**. It secures APIs using **JSON Web Tokens (JWT)** and guards specific business endpoints using granular **Role-Based Access Control (RBAC)** filters (Admin, Editor, Viewer).

## Core Security Features
- **Password Salting**: State-of-the-art password verification using \`bcrypt\` hashes.
- **Dual Token Flow**: Generates brief \`access_token\` items for session queries and separate extended \`refresh_token\` credentials to rotate expired access.
- **Cryptographic Guard**: Signature verifications backed by HS256 standard encryption keys.
- **Role Audits**: Injects custom access dependencies to prevent privilege escalation.

## Roles Matrix
- **Admin**: Complete master read & write access across resources.
- **Editor**: Medium access. Can create or update items but cannot execute administrative tasks.
- **Viewer**: Read-only profile view queries.
`
      },
      {
        path: "02-auth/requirements.txt",
        name: "requirements.txt",
        language: "text",
        description: "Python third-party package dependencies",
        content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pyjwt[crypto]>=2.8.0
passlib[bcrypt]>=1.7.4
pydantic>=2.6.4
python-dotenv>=1.0.1
`
      },
      {
        path: "02-auth/.env.example",
        name: ".env.example",
        language: "env",
        description: "Required signing secrets environment variables",
        content: `JWT_SECRET_KEY="replace_me_with_a_secure_long_random_alphanumeric_sequence_string"
JWT_REFRESH_SECRET_KEY="another_even_more_secure_randomly_composed_string_for_refresh_lifecycle"
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
`
      },
      {
        path: "02-auth/app/auth.py",
        name: "auth.py",
        language: "python",
        description: "Cryptographic signing, token generation, and dependency injection guards",
        content: `from datetime import datetime, timedelta, timezone
from typing import Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel

# Configuration settings (typically read from config/env)
SECRET_KEY = "system-cryptographic-signing-key-for-security-lab-demo-instance"
REFRESH_SECRET_KEY = "system-refresh-token-cryptography-signing-key-for-rotation-demo"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Cryptographic password hashing manager
password_crypt = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token retrieval protocol from standard Authorization: Bearer <token> headers
oauth2_flow = OAuth2PasswordBearer(tokenUrl="/auth/login")

class TokenClaims(BaseModel):
    sub: str  # Username
    role: str # auth roles like 'admin', 'editor', 'viewer'
    exp: int

# Mock user database for isolated running
USER_DATABASE = {
    "alice": {
        "username": "alice",
        "hashed_password": password_crypt.hash("adminpwd"),
        "role": "admin",
        "email": "alice@company.com"
    },
    "bob": {
        "username": "bob",
        "hashed_password": password_crypt.hash("editorpwd"),
        "role": "editor",
        "email": "bob@company.com"
    },
    "viewer": {
        "username": "viewer",
        "hashed_password": password_crypt.hash("viewerpwd"),
        "role": "viewer",
        "email": "viewer@company.com"
    }
}

def encrypt_password(plain_password: str) -> str:
    return password_crypt.hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_crypt.verify(plain_password, hashed_password)

def create_access_token(data: dict[str, Any]) -> str:
    """
    Generate standard Access Token encapsulating core claims.
    """
    claims = data.copy()
    expire_time = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    claims.update({"exp": int(expire_time.timestamp()), "type": "access"})
    return jwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict[str, Any]) -> str:
    """
    Generate long-lived Refresh Token strictly used for rotating access credentials.
    """
    claims = data.copy()
    expire_time = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    claims.update({"exp": int(expire_time.timestamp()), "type": "refresh"})
    return jwt.encode(claims, REFRESH_SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user_claims(token: str = Depends(oauth2_flow)) -> TokenClaims:
    """
    Dependency verifying bearer token signatures.
    """
    unauthorized_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = payload.get("sub")
        role: str | None = payload.get("role")
        token_type: str | None = payload.get("type")
        
        if username is None or role is None or token_type != "access":
            raise unauthorized_exception
            
        return TokenClaims(sub=username, role=role, exp=payload.get("exp", 0))
    except jwt.PyJWTError:
        raise unauthorized_exception

class RoleChecker:
    """
    Class-based dependency generator validating custom API roles (RBAC).
    """
    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, claims: TokenClaims = Depends(get_current_user_claims)) -> TokenClaims:
        if claims.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Resource forbidden. Requires roles: {self.allowed_roles}"
            )
        return claims
`
      },
      {
        path: "02-auth/app/main.py",
        name: "main.py",
        language: "python",
        description: "FastAPI server displaying credential checking",
        content: `from typing import Any
import jwt
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.auth import (
    USER_DATABASE, verify_password, create_access_token, create_refresh_token,
    get_current_user_claims, RoleChecker, TokenClaims, REFRESH_SECRET_KEY, ALGORITHM
)

app = FastAPI(
    title="JWT & Role-Based Security Engine",
    description="Implements JWT session tokens alongside fine-grained RBAC endpoint security model",
    version="1.0.0"
)

class TokenPayload(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class ProfileResponse(BaseModel):
    username: str
    email: str
    role: str

class RefreshRequest(BaseModel):
    refresh_token: str

@app.post("/auth/login", response_model=TokenPayload, tags=["Authentication"])
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate username/password credentials. Returns Access + Refresh tokens.
    """
    user_record = USER_DATABASE.get(form_data.username)
    if not user_record or not verify_password(form_data.password, user_record["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    claims = {"sub": user_record["username"], "role": user_record["role"]}
    return TokenPayload(
        access_token=create_access_token(claims),
        refresh_token=create_refresh_token(claims)
    )

@app.post("/auth/refresh", response_model=TokenPayload, tags=["Authentication"])
async def rotate_tokens(payload: RefreshRequest):
    """
    Authenticate refresh tokens. Reissues new session access credentials.
    """
    invalid_refresh_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        decoded_payload = jwt.decode(payload.refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        username: str | None = decoded_payload.get("sub")
        role: str | None = decoded_payload.get("role")
        token_type: str | None = decoded_payload.get("type")
        
        if username is None or role is None or token_type != "refresh":
            raise invalid_refresh_exception
            
        new_claims = {"sub": username, "role": role}
        return TokenPayload(
            access_token=create_access_token(new_claims),
            refresh_token=create_refresh_token(new_claims) # reissue fresh refresh token
        )
    except jwt.PyJWTError:
        raise invalid_refresh_exception

@app.get("/users/me", response_model=ProfileResponse, tags=["Users Profile"])
async def fetch_my_profile(claims: TokenClaims = Depends(get_current_user_claims)):
    """
    Access check: Any successfully logged-in user can reach this endpoint.
    """
    user_record = USER_DATABASE.get(claims.sub)
    if not user_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User database mismatch")
    
    return ProfileResponse(
        username=user_record["username"],
        email=user_record["email"],
        role=user_record["role"]
    )

@app.get("/admin/dashboard", tags=["Admin Portal"])
async def view_admin_portal(claims: TokenClaims = Depends(RoleChecker(allowed_roles=["admin"]))):
    """
    Guard: Exclusively users holding the role "admin" are permitted in.
    """
    return {
        "status": "success",
        "message": f"Welcome directly, Master Administrator {claims.sub}!",
        "payload": {"sensitive_server_metadata": "CORE_ACTIVE_PORTS_SHUT", "secure_logs": "all encryption modules healthy"}
    }

@app.get("/editor/content", tags=["Editor Workspace"])
async def write_editor_content(claims: TokenClaims = Depends(RoleChecker(allowed_roles=["admin", "editor"]))):
    """
    Guard: Permit roles "admin" and "editor" only. Viewers are blocked.
    """
    return {
        "status": "success",
        "message": f"Workspace unlocked for {claims.sub} holding role '{claims.role}'."
    }
`
      }
    ]
  },
  {
    id: "03-caching",
    title: "High-Performance Redis Caching",
    folder: "03-caching",
    topic: "Redis Client + Cache Invalidation + Cache-Aside",
    description: "Ultra-fast read layer utilizing Redis backend to optimize query load, complete with customizable eviction TTL, cache-aside wrappers, and proactive write-through updates.",
    files: [
      {
        path: "03-caching/README.md",
        name: "README.md",
        language: "markdown",
        description: "Redis caching explanations",
        content: `# Redis Caching Layer and Core Invalidation Strategies

This module features a high-performance database caching facade utilizing **Redis** inside a **FastAPI** environment. 

## Caching Archetypes Implemented
- **Cache-Aside (Lazy Loading)**: Read requests look up the cache first. If a Cache Miss hits, query the database, populates the Redis cache with a Time-To-Live (TTL), and returns.
- **Write-Through**: When updating data, modify both the primary database and the key in the cache immediately, guaranteeing full synchronization.
- **Proactive Invalidation**: When records get written, updated, or deleted, purge or refresh target partitions to avoid returning stale data.

## Fast Setup Guide
Ensure a Redis server is running locally on port 6379 before spinning up:
\`\`\`bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
\`\`\`
`
      },
      {
        path: "03-caching/requirements.txt",
        name: "requirements.txt",
        language: "text",
        description: "Python caching dependencies",
        content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
redis>=5.0.2
pydantic>=2.6.4
python-dotenv>=1.0.1
`
      },
      {
        path: "03-caching/.env.example",
        name: ".env.example",
        language: "env",
        description: "Secrets template mapping redis addresses",
        content: `REDIS_URL="redis://localhost:6379/0"
CACHE_DEFAULT_TTL=60
`
      },
      {
        path: "03-caching/app/cache.py",
        name: "cache.py",
        language: "python",
        description: "Redis connector library implementing standard serialization/deserialization helpers",
        content: `import json
from typing import Any
import redis

# Establish optimized Redis client connection
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

class RedisCacheManager:
    """
    Standard Redis key-value serialization broker with adjustable custom TTL values.
    """
    def __init__(self, client: redis.Redis) -> None:
        self.redis = client

    def get(self, key: str) -> Any | None:
        """
        Fetch deserialized cache object. Returns None on cache miss.
        """
        try:
            cached_val = self.redis.get(key)
            if cached_val:
                return json.loads(cached_val)
        except (redis.RedisError, TypeError, json.JSONDecodeError):
            # Fail-silent configuration to prevent application crashes when cache server drops
            pass
        return None

    def set(self, key: str, value: Any, ttl_seconds: int = 60) -> bool:
        """
        Store serialized JSON values mapped to designated key with static TTL eviction.
        """
        try:
            serialized = json.dumps(value)
            return self.redis.setex(name=key, time=ttl_seconds, value=serialized)
        except (redis.RedisError, TypeError):
            return False

    def invalidate(self, key: str) -> bool:
        """
        Explicitly delete a specific key from the cache to keep data fresh.
        """
        try:
            return bool(self.redis.delete(key))
        except redis.RedisError:
            return False

    def clear_prefix(self, prefix: str) -> int:
        """
        Invalidate cache space by removing all keys with a matching prefix.
        """
        try:
            keys = self.redis.keys(pattern=f"{prefix}*")
            if keys:
                return self.redis.delete(*keys)
        except redis.RedisError:
            pass
        return 0

# Static manager singleton assignment
cache_manager = RedisCacheManager(redis_client)
`
      },
      {
        path: "03-caching/app/main.py",
        name: "main.py",
        language: "python",
        description: "FastAPI server showing Redis speed benefits",
        content: `import time
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from app.cache import cache_manager

app = FastAPI(
    title="High-Performance Caching REST API",
    description="Showcases Cache-Aside and proactive cache invalidation using Redis",
    version="1.0.0"
)

class Product(BaseModel):
    id: str
    name: str
    price: float
    description: str | None = None

# Simulated Slow SQL Database to demonstrate Redis caching latency improvements
MOCK_SQL_DATABASE: dict[str, dict[str, Any]] = {
    "101": {"id": "101", "name": "Cloud Compute Instance", "price": 49.99, "description": "VPS Server"},
    "102": {"id": "102", "name": "Dedicated DB Storage", "price": 199.99, "description": "SSD RAID Engine"},
}

@app.get("/products/{product_id}", response_model=Product, tags=["Products"])
async def get_product(product_id: str):
    """
    Get API using CACHE-ASIDE (Lazy Loading) protocol.
    Loads from simulated DB on cache miss and populates Redis for future requests.
    """
    cache_key = f"product:{product_id}"
    
    # 1. Attempt lookup in Redis caching layer
    cached_payload = cache_manager.get(cache_key)
    if cached_payload:
        # Cache Hit - return instantly!
        return cached_payload

    # 2. Cache Miss - Query simulated SQL database with artificial lag
    if product_id not in MOCK_SQL_DATABASE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    time.sleep(1.5) # Simulate database query delay (1.5 seconds)
    product_record = MOCK_SQL_DATABASE[product_id]

    # 3. Populate Redis Cache with 60 seconds TTL expiration limit
    cache_manager.set(cache_key, product_record, ttl_seconds=60)
    
    return product_record

@app.put("/products/{product_id}", response_model=Product, tags=["Products"])
async def update_product(product_id: str, updated_data: Product):
    """
    Update API using WRITE-THROUGH and cache invalidation.
    Keeps the database and Redis cache in perfect sync.
    """
    if product_id not in MOCK_SQL_DATABASE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # 1. Write-Through - Update primary database
    MOCK_SQL_DATABASE[product_id] = updated_data.model_dump()

    # 2. Write-Through / Invalidation - Refresh Redis Key
    cache_key = f"product:{product_id}"
    cache_manager.set(cache_key, MOCK_SQL_DATABASE[product_id], ttl_seconds=60)

    return MOCK_SQL_DATABASE[product_id]

@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Products"])
async def delete_product(product_id: str):
    """
    Delete database resource and invalidate stale cache entries instantly.
    """
    if product_id not in MOCK_SQL_DATABASE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # 1. Purge record from primary database
    del MOCK_SQL_DATABASE[product_id]

    # 2. Invalidate stale key from Redis cache space
    cache_key = f"product:{product_id}"
    cache_manager.invalidate(cache_key)

    return None
`
      }
    ]
  },
  {
    id: "04-message-queues",
    title: "Celery Background Workers",
    folder: "04-message-queues",
    topic: "RabbitMQ Broker + Celery Task Queue + Redis Backend",
    description: "Asynchronous task distributor using RabbitMQ as message broker and Celery worker routines for background processing, complete with task status tracking via Redis.",
    files: [
      {
        path: "04-message-queues/README.md",
        name: "README.md",
        language: "markdown",
        description: "Architecture guidelines for queue systems",
        content: `# Async Processing with RabbitMQ Queue & Celery Background Workers

This module implements an asynchronous worker architecture combining **FastAPI**, **RabbitMQ** (Message Queue Broker), and **Celery** (Distributed Task Queue System) to offload heavy workloads from the web thread.

## Architectural Component Mapping
- **API Thread**: Accepts request parameters, fires tasks to RabbitMQ, and returns a transaction \`task_id\` instantly (keeping response times under 5ms).
- **RabbitMQ**: AMQP-based enterprise queuing service distributing task details.
- **Celery Worker**: Decoupled Python daemon workers processing heavy tasks in background pools.
- **Redis Result Cache**: Persists status and return payloads for web audit checks.

## Setup Instructions
1. Establish active instances of RabbitMQ and Redis.
2. Install pip list:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
3. Run Celery backend daemon:
   \`\`\`bash
   celery -A app.celery_app.celery worker --loglevel=info
   \`\`\`
4. Run FastAPI instance server:
   \`\`\`bash
   uvicorn app.main:app --reload --port 8000
   \`\`\`
`
      },
      {
        path: "04-message-queues/requirements.txt",
        name: "requirements.txt",
        language: "text",
        description: "Celery system python packages",
        content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
celery>=5.3.6
redis>=5.0.2
pydantic>=2.6.4
python-dotenv>=1.0.1
`
      },
      {
        path: "04-message-queues/.env.example",
        name: ".env.example",
        language: "env",
        description: "Message broker connections setting variables",
        content: `CELERY_BROKER_URL="pyamqp://guest:guest@localhost:5672//"
CELERY_RESULT_BACKEND="redis://localhost:6379/1"
`
      },
      {
        path: "04-message-queues/app/celery_app.py",
        name: "celery_app.py",
        language: "python",
        description: "Celery configuration mapping RabbitMQ broker and Redis backend results",
        content: `from celery import Celery

CELERY_BROKER_URL = "pyamqp://guest:guest@localhost:5672//"
CELERY_RESULT_BACKEND = "redis://localhost:6379/1"

# Instantiate Celery object mapping core task modules
celery = Celery(
    "background_tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["app.tasks"]
)

# Robust celery configuration parameters
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    # Prevent memory leaks by recycling workers after 100 tasks
    worker_max_tasks_per_child=100
)
`
      },
      {
        path: "04-message-queues/app/tasks.py",
        name: "tasks.py",
        language: "python",
        description: "Celery task registry with mock heavy work payloads",
        content: `import time
from app.celery_app import celery

@celery.task(name="tasks.generate_pdf_report")
def generate_pdf_report(user_id: int, file_name: str) -> dict[str, str]:
    """
    Simulated PDF generator logic that compiles user reports in the background.
    """
    time.sleep(8.0) # Simulate a heavy 8-seconds PDF rendering process
    return {
        "status": "completed",
        "file_url": f"https://cdn.company/reports/{file_name}.pdf",
        "owner_id": str(user_id)
    }

@celery.task(name="tasks.send_welcome_email")
def send_welcome_email(recipient: str, promo: bool = False) -> str:
    """
    Background worker sending transactional welcome emails.
    """
    time.sleep(3.0) # Simulate network handshake delay (3 seconds)
    return f"Welcome email sent successfully to {recipient} with promotion={promo}"

@celery.task(name="tasks.compress_assets")
def compress_assets(file_path: str) -> dict[str, Any]:
    """
    Asset rendering optimization engine running on worker processes.
    """
    time.sleep(5.0) # Simulate image compression algorithm
    return {
        "original_file": file_path,
        "compressed_file": file_path.replace(".png", "_optimized.webp"),
        "factor": "72% storage saved"
    }
`
      },
      {
        path: "04-message-queues/app/main.py",
        name: "main.py",
        language: "python",
        description: "FastAPI server triggering worker events and returning task_id handles",
        content: `from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, EmailStr
from app import tasks

app = FastAPI(
    title="Asynchronous Task Dispatcher",
    description="Fires heavy tasks off to background workers via Celery & RabbitMQ",
    version="1.0.0"
)

class ReportRequest(BaseModel):
    user_id: int
    report_name: str

class EmailRequest(BaseModel):
    email: EmailStr
    include_promotion: bool = False

@app.post("/tasks/report", status_code=status.HTTP_202_ACCEPTED, tags=["Background Tasks"])
async def trigger_report_compilation(data: ReportRequest):
    """
    Submit report compilation task to background workers.
    Returns status instantly with an operational token parameter (task_id).
    """
    # Trigger task asynchronously using Celery's delay method
    task_handle = tasks.generate_pdf_report.delay(data.user_id, data.report_name)
    return {
        "task_id": task_handle.id,
        "status": "QUEUED",
        "message": "Report generation delegated to Celery workers"
    }

@app.post("/tasks/email", status_code=status.HTTP_202_ACCEPTED, tags=["Background Tasks"])
async def trigger_email_delivery(data: EmailRequest):
    """
    Queue standard welcome emails for processing.
    """
    task_handle = tasks.send_welcome_email.delay(data.email, data.include_promotion)
    return {
        "task_id": task_handle.id,
        "status": "QUEUED"
    }

@app.get("/tasks/{task_id}", tags=["Task Broker Status"])
async def query_task_status(task_id: str):
    """
    Check on Celery task status using task ID.
    Retrieves execution state (PENDING, STARTED, SUCCESS, FAILURE).
    """
    from celery.result import AsyncResult
    from app.celery_app import celery
    
    task_result = AsyncResult(task_id, app=celery)
    
    response = {
        "task_id": task_id,
        "state": task_result.state,
    }
    
    if task_result.state == "SUCCESS":
        response["result"] = task_result.result
    elif task_result.state == "FAILURE":
        response["error"] = str(task_result.info)
        
    return response
`
      }
    ]
  },
  {
    id: "05-websockets",
    title: "Real-Time WebSockets Server",
    folder: "05-websockets",
    topic: "FastAPI WebSockets + Full-Duplex Connection Engine",
    description: "Highly interactive bidirectional connection manager designed for scaling multi-client chats, streaming framework messages, and socket rooms.",
    files: [
      {
        path: "05-websockets/README.md",
        name: "README.md",
        language: "markdown",
        description: "WebSocket connection details and lifecycle specs",
        content: `# Real-Time WebSockets Broadcast Server

This module provides a fully functional, bidirectional communication server using **FastAPI WebSockets**. It showcases persistent client connections, real-time message broadcasting, separate chat room channels, and active connection tracking.

## WebSocket Protocol Handshake
1. Client initiates HTTP handshake: \`GET ws://host/ws/{room_id}/{username}\`
2. FastAPI upgrades protocol connection to full-duplex WebSocket \`101 Switching Protocols\`.
3. Persistent channel stays open, enabling real-time JSON frame events.

## Running instructions:
\`\`\`bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
\`\`\`
`
      },
      {
        path: "05-websockets/requirements.txt",
        name: "requirements.txt",
        language: "text",
        description: "Required python libraries for WebSockets",
        content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
websockets>=12.0
pydantic>=2.6.4
`
      },
      {
        path: "05-websockets/app/main.py",
        name: "main.py",
        language: "python",
        description: "FastAPI WebSocket server with room connection state management",
        content: `import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI(
    title="WebSocket Broadcast Engine",
    description="Real-time multi-room message distribution utilizing persistent connection pooling",
    version="1.0.0"
)

class ConnectionManager:
    """
    Handles WebSocket connection scaling, room isolation, and message broadcasting.
    """
    def __init__(self) -> None:
        # Maps room_id strings to direct list of active socket objects
        self.active_rooms: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str) -> None:
        """
        Accept incoming handshake and enroll client into active room directory.
        """
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []
        self.active_rooms[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str) -> None:
        """
        Remove socket from active room registry when connection breaks.
        """
        if room_id in self.active_rooms:
            if websocket in self.active_rooms[room_id]:
                self.active_rooms[room_id].remove(websocket)
            if not self.active_rooms[room_id]:
                del self.active_rooms[room_id]

    async def send_personal_message(self, message: str, websocket: WebSocket) -> None:
        """
        Send direct JSON frame back to single client socket.
        """
        await websocket.send_text(message)

    async def broadcast_to_room(self, message: dict, room_id: str) -> None:
        """
        Broadcast serialized payloads to all clients connected to room.
        """
        if room_id in self.active_rooms:
            payload_str = json.dumps(message)
            for connection in self.active_rooms[room_id]:
                try:
                    await connection.send_text(payload_str)
                except Exception:
                    # Clean up broken connection pool frames proactively
                    pass

manager = ConnectionManager()

@app.websocket("/ws/{room_id}/{username}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, username: str):
    """
    Primary persistent socket portal. Coordinates real-time events.
    """
    await manager.connect(websocket, room_id)
    
    # Broadcast standard join notification frame
    join_payload = {
        "sender": "System",
        "message": f"User {username} joined the chat room",
        "type": "notification"
    }
    await manager.broadcast_to_room(join_payload, room_id)
    
    try:
        while True:
            # Block and wait for payload frame
            data = await websocket.receive_text()
            
            event_payload = {
                "sender": username,
                "message": data,
                "type": "message"
            }
            # Broadcast the client's message to everyone in the room
            await manager.broadcast_to_room(event_payload, room_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        leave_payload = {
            "sender": "System",
            "message": f"{username} disconnected from the room.",
            "type": "notification"
        }
        await manager.broadcast_to_room(leave_payload, room_id)
`
      },
      {
        path: "05-websockets/index.html",
        name: "index.html",
        language: "html",
        description: "Static testing HTML file showcasing socket connections",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>WebSocket Test UI</title>
</head>
<body style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px;">
    <h2>WebSocket Chat Client</h2>
    <input id="roomField" placeholder="Room ID" value="general">
    <input id="userField" placeholder="Username" value="guest">
    <button onclick="connectSocket()">Establish Connection</button>
    <div id="messages" style="height: 250px; border: 1px solid #ccc; overflow-y: scroll; margin-top: 15px; padding: 10px;"></div>
    <input id="msgField" placeholder="Write message..." style="width: 80%; margin-top: 10px;">
    <button onclick="sendMessage()">Send</button>

    <script>
        let ws;
        function connectSocket() {
            const room = document.getElementById("roomField").value;
            const user = document.getElementById("userField").value;
            ws = new WebSocket(\`ws://localhost:8000/ws/\${room}/\${user}\`);
            ws.onmessage = function(event) {
                const logs = document.getElementById("messages");
                const parsed = JSON.parse(event.data);
                logs.innerHTML += \`<div><b>\${parsed.sender}</b>: \${parsed.message}</div>\`;
                logs.scrollTop = logs.scrollHeight;
            };
        }
        function sendMessage() {
            const input = document.getElementById("msgField");
            if (ws && input.value) {
                ws.send(input.value);
                input.value = "";
            }
        }
    </script>
</body>
</html>
`
      }
    ]
  },
  {
    id: "06-graphql",
    title: "Strawberry GraphQL API",
    folder: "06-graphql",
    topic: "Strawberry GraphQL + FastAPI Integration",
    description: "Highly structured and typed GraphQL API implementing custom Queries, schema mutations, and WS-based subscription streams.",
    files: [
      {
        path: "06-graphql/README.md",
        name: "README.md",
        language: "markdown",
        description: "GraphQL schema modeling and operation instructions",
        content: `# Strawberry GraphQL with FastAPI

This module implements a state-of-the-art **GraphQL API** using the standard **Strawberry** Python type annotation framework. It natively supports queries, mutations, and real-time subscription channels over WebSockets.

## Key Architecture Concepts
- **Strawberry Types**: Standard Python classes decorated with \`@strawberry.type\` that mirror database schemas.
- **Queries**: Fetch specific fields matching exact clients expectations, reducing over-fetching.
- **Mutations**: Write or edit resource records.
- **Subscriptions**: Push real-time asynchronous updates to clients using \`asyncio\` event generators.

## Spin Up Server
\`\`\`bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
\`\`\`
Open \`http://localhost:8000/graphql\` to launch the interactive GraphQL GraphiQL IDE.
`
      },
      {
        path: "06-graphql/requirements.txt",
        name: "requirements.txt",
        language: "text",
        description: "GraphQL packages required",
        content: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
strawberry-graphql[fastapi]>=0.219.0
pydantic>=2.6.4
`
      },
      {
        path: "06-graphql/app/schema.py",
        name: "schema.py",
        language: "python",
        description: "Strawberry code defining types, queries, mutations, and subscriptions",
        content: `import asyncio
from typing import AsyncGenerator
import strawberry

@strawberry.type
class UserProfile:
    id: int
    username: str
    role: str
    email: str

# Static database representation
USER_REGISTRY = [
    UserProfile(id=1, username="alice", role="admin", email="alice@corp.com"),
    UserProfile(id=2, username="bob", role="editor", email="bob@corp.com"),
]

# Subscription message events stream
MESSAGE_EVENTS: list[str] = []

@strawberry.type
class Query:
    @strawberry.field
    def list_users(self) -> list[UserProfile]:
        """
        Query: Retrieve all registered database Users.
        """
        return USER_REGISTRY

    @strawberry.field
    def find_user_by_id(self, user_id: int) -> UserProfile | None:
        """
        Query: Extract user profile by unique ID.
        """
        for user in USER_REGISTRY:
            if user.id == user_id:
                return user
        return None

@strawberry.type
class Mutation:
    @strawberry.mutation
    def register_user(self, username: str, email: str, role: str) -> UserProfile:
        """
        Mutation: Add user to database directory and publish event log.
        """
        new_id = len(USER_REGISTRY) + 1
        new_user = UserProfile(
            id=new_id,
            username=username,
            email=email,
            role=role
        )
        USER_REGISTRY.append(new_user)
        # Record registration event message structure
        MESSAGE_EVENTS.append(f"LOG: Registered user '{username}' with role '{role}'")
        return new_user

@strawberry.type
class Subscription:
    @strawberry.subscription
    async def monitor_registrations(self) -> AsyncGenerator[str, None]:
        """
        Subscription: Real-time notification streams.
        Checks for new MESSAGE_EVENTS and yields updates.
        """
        last_index = len(MESSAGE_EVENTS)
        while True:
            # Yield any newly appended message events
            if len(MESSAGE_EVENTS) > last_index:
                for i in range(last_index, len(MESSAGE_EVENTS)):
                    yield MESSAGE_EVENTS[i]
                last_index = len(MESSAGE_EVENTS)
            await asyncio.sleep(1.0) # Check event queue every second

# Export completed schema containing queries, mutations, and subscriptions
schema = strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription)
`
      },
      {
        path: "06-graphql/app/main.py",
        name: "main.py",
        language: "python",
        description: "Application engine mounting Strawberry GraphQL Router client-side",
        content: `from fastapi import FastAPI
from strawberry.fastapi import GraphQLRouter
from app.schema import schema

app = FastAPI(
    title="GraphQL API Engine",
    description="Implements type-safe API operations powered by FastAPI & Strawberry",
    version="1.0.0"
)

# Initialize standard Strawberry GraphQLRouter
graphql_router = GraphQLRouter(schema)

# Mount router. Exposes high-fidelity web IDE playground directly
app.include_router(graphql_router, prefix="/graphql")

@app.get("/")
async def root():
    return {"message": "Active. Access GraphQL console interface at /graphql"}
`
      },
      {
        path: "06-graphql/.env.example",
        name: ".env.example",
        language: "env",
        description: "GraphQL configuration variables template",
        content: `ENV="development"
PORT=8000
`
      }
    ]
  },
  {
    id: "docker",
    title: "Docker Setup & Service Wiring",
    folder: "docker",
    topic: "Multi-stage Dockerfiles + Compose Network Orthogonalization",
    description: "Production wiring bundling REST API, Redis caching, Celery task workers, and PostgreSQL under a unified Docker orchestration system.",
    files: [
      {
        path: "docker/docker-compose.yml",
        name: "docker-compose.yml",
        language: "yaml",
        description: "Docker Compose manifest uniting database, redis, rabbitmq, application, and celery worker-node service environments",
        content: `version: '3.8'

services:
  # 1. Primary Relational PostgreSQL Layer
  postgres_db:
    image: postgres:15-alpine
    container_name: backend_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secure_superuser_postgres_password
      POSTGRES_DB: backend_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - lab_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. Redis Caching Engine
  redis_cache:
    image: redis:7-alpine
    container_name: backend_redis
    ports:
      - "6379:6379"
    networks:
      - lab_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 3. RabbitMQ Message Broker
  rabbitmq_broker:
    image: rabbitmq:3-management-alpine
    container_name: backend_rabbitmq
    ports:
      - "5672:5672"   # AMQP protocol handler
      - "15672:15672" # Management dashboard console
    networks:
      - lab_network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 10s
      timeout: 10s
      retries: 5

  # 4. Primary API Server Service container
  api_service:
    build:
      context: ../
      dockerfile: docker/Dockerfile.app
    container_name: backend_api_app
    environment:
      - DATABASE_URL=postgresql+asyncpg://postgres:secure_superuser_postgres_password@postgres_db:5432/backend_db
      - REDIS_URL=redis://redis_cache:6379/0
      - CELERY_BROKER_URL=pyamqp://guest:guest@rabbitmq_broker:5672//
    ports:
      - "8000:8000"
    depends_on:
      postgres_db:
        condition: service_healthy
      redis_cache:
        condition: service_healthy
      rabbitmq_broker:
        condition: service_healthy
    networks:
      - lab_network

  # 5. Celery Worker Pool Node
  celery_worker:
    build:
      context: ../
      dockerfile: docker/Dockerfile.worker
    container_name: backend_celery_node
    environment:
      - REDIS_URL=redis://redis_cache:6379/1
      - CELERY_BROKER_URL=pyamqp://guest:guest@rabbitmq_broker:5672//
    depends_on:
      rabbitmq_broker:
        condition: service_healthy
      redis_cache:
        condition: service_healthy
    networks:
      - lab_network

volumes:
  postgres_data:

networks:
  lab_network:
    driver: bridge
`
      },
      {
        path: "docker/Dockerfile.app",
        name: "Dockerfile.app",
        language: "dockerfile",
        description: "Standard secure multi-stage build running the FastAPI REST server under non-privileged credentials",
        content: `# Stage 1: Build virtual python environment to keep container image lightweight
FROM python:3.11-slim AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Packaging light target image
FROM python:3.11-slim AS final_release

WORKDIR /app

# Bring installed libraries from builder stage
COPY --from=builder /root/.local /root/.local
COPY . /app

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Expose server entry ports
EXPOSE 8000

# Implement user privileges security barrier to block potential root exploits
RUN useradd -u 8888 appuser && chown -R appuser:appuser /app
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
`
      },
      {
        path: "docker/Dockerfile.worker",
        name: "Dockerfile.worker",
        language: "dockerfile",
        description: "Worker docker container packaging asynchronous processes",
        content: `FROM python:3.11-slim AS builder

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential \\
    && rm -rf /var/lib/apt/lists/*

COPY 04-message-queues/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim AS runner

WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY 04-message-queues /app

ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

RUN useradd -u 8888 workeruser && chown -R workeruser:workeruser /app
USER workeruser

CMD ["celery", "-A", "app.celery_app.celery", "worker", "--loglevel=info"]
`
      }
    ]
  },
  {
    id: "pipelines",
    title: "CI Pipeline (GitHub Workflows)",
    folder: ".github/workflows",
    topic: "GitHub Actions Tests, Linter checks, and Automated Docker Builds",
    description: "Multi-layered delivery integration workflow running automatic Black lints, Flake8 compliance validation, pytest arrays, and Docker hub build-and-push schemas.",
    files: [
      {
        path: ".github/workflows/ci.yml",
        name: "ci.yml",
        language: "yaml",
        description: "GitHub Actions CI YAML build sequence tracking branch pushes",
        content: `name: High-Fidelity API CI Pipeline

on:
  push:
    branches: [ main, master, development ]
  pull_request:
    branches: [ main, master ]

jobs:
  # Job 1: Lint, Format, and Structural Integrity Check
  lint_and_format:
    runs-on: ubuntu-latest
    steps:
      - name: Fetch code workspace repository
        uses: actions/checkout@v4

      - name: Configure Python Environment (3.11)
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install Linting Tool Dependencies
        run: |
          python -m pip install --upgrade pip
          pip install flake8 black holds-isort

      - name: Execute Black code format verification (PEP 8)
        run: black --check 01-rest-api 02-auth 03-caching 04-message-queues 05-websockets 06-graphql

      - name: Execute Flake8 strict syntax parsing
        run: flake8 01-rest-api/app 02-auth/app 03-caching/app 04-message-queues/app 05-websockets/app 06-graphql/app --count --select=E9,F63,F7,F82 --show-source --statistics

  # Job 2: Integrated Unit & DB testing suites
  run_unit_tests:
    runs-on: ubuntu-latest
    needs: lint_and_format
    services:
      # Spawn background testing containers
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: backend_test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U test_user -d backend_test_db"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Fetch code workspace
        uses: actions/checkout@v4

      - name: Configure Python Runtime Environment
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'

      - name: Install API & Testing Orchestration Dependencies
        run: |
          pip install pytest httpx
          pip install -r 01-rest-api/requirements.txt
          pip install -r 03-caching/requirements.txt

      - name: Execute Pytest Suite (REST API + Cache Layers)
        env:
          DATABASE_URL: "postgresql+asyncpg://test_user:test_password@localhost:5432/backend_test_db"
          REDIS_URL: "redis://localhost:6379/0"
        run: |
          # Inject target path mapping
          export PYTHONPATH=$PYTHONPATH:$(pwd)/01-rest-api:$(pwd)/03-caching
          pytest -v

  # Job 3: Secure Docker Release Packaging
  build_docker_image:
    runs-on: ubuntu-latest
    needs: run_unit_tests
    steps:
      - name: Fetch repository context
        uses: actions/checkout@v4

      - name: Set up Docker Buildx Builder
        uses: docker/setup-buildx-action@v3

      - name: Sign into GitHub Container Registry (GHCR)
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Compile and Securely Push FastAPI Server Image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: docker/Dockerfile.app
          push: true
          tags: |
            ghcr.io/\${{ github.repository }}/backend-api:latest
            ghcr.io/\${{ github.repository }}/backend-api:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
`
      }
    ]
  },
  {
    id: "repo-root",
    title: "Repository Root & Configs",
    folder: "Root",
    topic: "Repository Master README & Standard Configurations",
    description: "General workspace configuration files including a master reference guide with badges, diagrams, directories table, and system rules.",
    files: [
      {
        path: "README.md",
        name: "README.md",
        language: "markdown",
        description: "Official repository documentation",
        content: `# Backend Engineering Lab: Reference & Curriculum Blueprint

[![Python Version](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-validated-blue?logo=docker)](https://www.docker.com/)
[![CI Pipeline](https://github.com/quayecodes/backend-engineering/actions/workflows/ci.yml/badge.svg)](https://github.com/quayecodes/backend-engineering/actions)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A production-grade reference architecture for backend engineering systems, providing concrete implementations of crucial backend components, design patterns, and deployment configurations.

## Blueprint Modules Table

| ID | Folder | Primary Tech | Architectural Highlight |
|---|---|---|---|
| **01** | \`01-rest-api/\` | FastAPI, PostgreSQL, SQLAlchemy 2, Alembic | Async ORM connection pooling, migrations, structured models & Pydantic response parsing |
| **02** | \`02-auth/\` | PyJWT, Bcrypt, FastAPI Depend | Multi-token flow (Access + Refresh), password salting, Role-Based Access controls |
| **03** | \`03-caching/\` | Redis, FastAPI, Serialization | Lazy Cache-Aside reading layers, proactive invalidations on mutations |
| **04** | \`04-message-queues/\` | RabbitMQ, Celery, Redis Backend | Offloading computational loads, task trackers, progress checkers |
| **05** | \`05-websockets/\` | FastAPI WebSockets | Bidirectional multi-client full-duplex communication pipelines, room directories |
| **06** | \`06-graphql/\` | Strawberry, GraphQL | Strongly typed models schemas, custom GraphQL queries, subscription updates |
| **07** | \`docker/\` | Docker, Compose | Self-contained, networks-isolated environment wiring all databases & servers together |
| **08** | \`.github/\` | GitHub Actions YAML | Absolute quality controls covering formatting, unittest testing, and registry builds |

---

## Workspace System Design Block

\`\`\`
                          +------------------------------------------+
                          |            Github Actions / CI           |
                          +--------------------+---------------------+
                                               | (Auto Runs)
                                               v
                          +------------------------------------------+
                          |             Docker Compose               |
                          +--+----------------+----------------+---+--+
                             |                |                |   |
                             v                v                v   v
                      +------+------+  +------+------+  +------+---+--+
                      | FastAPI App |  | PostgreSQL  |  | Redis Cache |
                      +------+------+  +------+------+  +-------------+
                             |                
                             | (Tasks dispatch)
                             v
                      +------+------+  +-------------+
                      |  RabbitMQ   |--+Celery Worker|
                      +-------------+  +-------------+
\`\`\`

## Fast Stack Bootup (Local Core Setup)
1. **Prerequisite**: Install Docker & Docker Compose.
2. **Launch all modules at once**:
   \`\`\`bash
   cd docker
   docker-compose up --build -d
   \`\`\`
   This fires PostgreSQL, Redis, RabbitMQ, Celery workers, and the main FastAPI server in a single sweep!
3. **API Access Panel**:
   - FastAPI Documentation UI: \`http://localhost:8000/docs\`
   - GraphQL Web Playground: \`http://localhost:8000/graphql\`
   - RabbitMQ Management Panel: \`http://localhost:15672/ \` (Login: \`guest\` / \`guest\`)
`
      },
      {
        path: ".gitignore",
        name: ".gitignore",
        language: "gitignore",
        description: "Standard Python GIT ignore variables directive",
        content: `__pycache__/
*.py[cod]
*$py.class
.venv/
venv/
ENV/
env/
.env

# Database migrations / logs
*.db
*.log
.pytest_cache/
.coverage
htmlcov/

# Redis / Docker
dump.rdb
.docker-volumes/
`
      },
      {
        path: "LICENSE",
        name: "LICENSE",
        language: "text",
        description: "Official MIT Repository License",
        content: `MIT License

Copyright (c) 2026 Quaye Codes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`
      }
    ]
  }
];
