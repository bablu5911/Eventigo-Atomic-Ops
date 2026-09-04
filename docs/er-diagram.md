# Atomic Ops Database Entity-Relationship Diagram

This document contains the complete 7-collection Mongoose entity-relationship layout in Mermaid `.mmd` syntax.

```mermaid
erDiagram
    USER ||--o{ EVENT : organizes
    USER ||--o{ BOOKING : creates
    USER ||--o{ REVIEW : writes
    
    CATEGORY ||--o{ EVENT : categorizes
    
    EVENT ||--o{ TICKET_TYPE : contains
    EVENT ||--o{ PROMO_CODE : offers
    EVENT ||--o{ BOOKING : receives
    EVENT ||--o{ REVIEW : reviews
    
    BOOKING ||--o{ TICKET_ITEM : embeds
    BOOKING ||--o| REVIEW : generates

    USER {
        ObjectId _id PK
        string name
        string email UK
        string password "select: false"
        string role "enum: attendee|organizer|admin"
        date createdAt
        date updatedAt
    }

    CATEGORY {
        ObjectId _id PK
        string name
        string slug UK
        string description
        date createdAt
    }

    EVENT {
        ObjectId _id PK
        ObjectId organizer FK
        string title
        string slug UK
        ObjectId category FK
        string description
        string banner
        object venue
        date startDateTime
        date endDateTime
        boolean isOnline
        string meetingLink
        string status "enum: draft|published|cancelled|completed"
        number totalCapacity
        boolean isApproved
        date createdAt
    }

    TICKET_TYPE {
        ObjectId _id PK
        ObjectId event FK
        string name
        number price
        number totalQuantity
        number soldQuantity
        number maxPerUser
        date saleStartDate
        date saleEndDate
        string description
        date createdAt
    }

    BOOKING {
        ObjectId _id PK
        string bookingCode UK
        ObjectId user FK
        ObjectId event FK
        array tickets
        number totalAmount
        string status "enum: confirmed|cancelled|refunded"
        date attendedAt
        date createdAt
    }

    PROMO_CODE {
        ObjectId _id PK
        ObjectId event FK
        string code
        string discountType "enum: flat|percentage"
        number value
        number usageLimit
        number usedCount
        date createdAt
    }

    REVIEW {
        ObjectId _id PK
        ObjectId booking FK_UK
        ObjectId event FK
        ObjectId user FK
        number rating "min: 1, max: 5"
        string comment
        date createdAt
    }
```
