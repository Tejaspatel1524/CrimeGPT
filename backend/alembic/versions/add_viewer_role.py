"""add viewer role to user role enum

Revision ID: h0c1e5f4g7d8
Revises: g9b0d4e2f3c6
Create Date: 2026-07-03 15:20:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'h0c1e5f4g7d8'
down_revision = 'g9b0d4e2f3c6'
branch_labels = None
depends_on = None


def upgrade():
    # Add 'viewer' to the UserRole enum
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'viewer'")


def downgrade():
    # Note: PostgreSQL doesn't support removing enum values easily
    # This would require recreating the enum type
    pass
