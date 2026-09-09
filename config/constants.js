const ROLES = {
    CUSTOMER: "Customer",
    AGENT: "Agent",
    MANAGER: "Manager"
};

const TICKET_STATUS = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    ON_HOLD: "On Hold",
    RESOLVED: "Resolved",
    CLOSED: "Closed"
};

const VALID_STATUS_TRANSITIONS = {
    [TICKET_STATUS.OPEN]: [
        TICKET_STATUS.IN_PROGRESS,
        TICKET_STATUS.ON_HOLD
    ],

    [TICKET_STATUS.IN_PROGRESS]: [
        TICKET_STATUS.ON_HOLD,
        TICKET_STATUS.RESOLVED
    ],

    [TICKET_STATUS.ON_HOLD]: [
        TICKET_STATUS.IN_PROGRESS
    ],

    [TICKET_STATUS.RESOLVED]: [
        TICKET_STATUS.CLOSED
    ],

    [TICKET_STATUS.CLOSED]: []
};

const TICKET_PRIORITY = {
    LOW: "Low",
    MEDIUM: "Medium",
    HIGH: "High",
    CRITICAL: "Critical"
};

const TICKET_CATEGORY = {
    TECHNICAL: "Technical",
    BILLING: "Billing",
    ACCOUNT: "Account",
    GENERAL: "General"
};

module.exports = {
    ROLES,
    TICKET_STATUS,
    TICKET_PRIORITY,
    TICKET_CATEGORY,
    VALID_STATUS_TRANSITIONS
};