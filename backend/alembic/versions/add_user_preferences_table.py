"""add user preferences table

Revision ID: g9b0d4e2f3c6
Revises: f8a9c3d1e2b5
Create Date: 2026-07-03 14:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone


# revision identifiers, used by Alembic.
revision = 'g9b0d4e2f3c6'
down_revision = 'f8a9c3d1e2b5'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('theme', sa.String(), nullable=False),
        sa.Column('language', sa.String(), nullable=False),
        sa.Column('timezone', sa.String(), nullable=False),
        sa.Column('date_format', sa.String(), nullable=False),
        sa.Column('time_format', sa.String(), nullable=False),
        sa.Column('notifications_case_assignment', sa.Integer(), nullable=False),
        sa.Column('notifications_crimegpt', sa.Integer(), nullable=False),
        sa.Column('notifications_evidence', sa.Integer(), nullable=False),
        sa.Column('notifications_report', sa.Integer(), nullable=False),
        sa.Column('notifications_cross_case', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    op.create_index(op.f('ix_user_preferences_user_id'), 'user_preferences', ['user_id'], unique=True)


def downgrade():
    op.drop_index(op.f('ix_user_preferences_user_id'), table_name='user_preferences')
    op.drop_table('user_preferences')
