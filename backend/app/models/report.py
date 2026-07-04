from enum import Enum


class RecommendedAction(str, Enum):
    verify_upi = "Verify ownership of UPI ID"
    request_bank_records = "Request bank transaction records"
    check_subscriber = "Check subscriber details"
    request_cdr = "Request call detail records"
    domain_reputation = "Perform domain reputation analysis"
    verify_transaction = "Verify transaction history"
    prioritize = "Prioritize investigation"
    contact_victim = "Contact victim immediately"
