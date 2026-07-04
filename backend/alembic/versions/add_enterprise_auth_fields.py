"""add enterprise auth fields

Revision ID: enterprise_auth_001
Revises: e5e832ac9f51
Create Date: 2026-06-30

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision = 'enterprise_auth_001'
down_revision = 'e5e832ac9f51'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Rename 'name' column to 'full_name'
    op.alter_column('users', 'name', new_column_name='full_name')
    
    # Rename 'hashed_password' to 'password_hash'
    op.alter_column('users', 'hashed_password', new_column_name='password_hash')
    
    # Add new columns
    op.add_column('users', sa.Column('department', sa.String(), nullable=True))
    op.add_column('users', sa.Column('profile_photo', sa.String(), nullable=True))
    op.add_column('users', sa.Column('is_active', sa.Integer(), nullable=False, server_default='1'))
    op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()))


def downgrade() -> None:
    # Remove added columns
    op.drop_column('users', 'updated_at')
    op.drop_column('users', 'failed_login_attempts')
    op.drop_column('users', 'last_login')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'profile_photo')
    op.drop_column('users', 'department')
    
    # Rename columns back
    op.alter_column('users', 'password_hash', new_column_name='hashed_password')
    op.alter_column('users', 'full_name', new_column_name='name')
