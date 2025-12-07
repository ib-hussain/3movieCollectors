# MySQL Event Scheduler Setup

This project now uses **MySQL Event Scheduler** for all automated background tasks instead of Node.js cron jobs. This maximizes the use of MySQL's native capabilities.

## Setup Instructions

### 1. Enable MySQL Event Scheduler

Run this SQL command to enable the Event Scheduler:

```sql
SET GLOBAL event_scheduler = ON;
```

### 2. Create Scheduled Events

Run the SQL file to create all three scheduled events:

```bash
mysql -u root -p 3moviecollectors < AdvancedERD/event_scheduler.sql
```

Or manually execute the contents of `event_scheduler.sql` in your MySQL client.

## Scheduled Events

### 1. **send_event_reminders**

- **Schedule**: Every 10 minutes
- **Purpose**: Sends notifications to event hosts and participants 1 hour before events start
- **Logic**:
  - Finds events starting in 50-60 minutes
  - Prevents duplicate notifications within 2 hours
  - Inserts notifications for host and all participants

### 2. **auto_complete_events**

- **Schedule**: Every 5 minutes
- **Purpose**: Automatically completes events and updates user watchlists
- **Logic**:
  - Finds events where `eventDateTime + duration < NOW()`
  - Adds/updates movie in all participants' watchlists with status = 'Completed'
  - Deletes the completed event from the database

### 3. **cleanup_old_notifications**

- **Schedule**: Every 1 hour
- **Purpose**: Deletes read notifications older than 24 hours
- **Logic**: Removes notifications where `isSeen = TRUE` and `timeStamp < NOW() - 24 hours`

## Managing Events

### Check Event Status

```sql
SELECT EVENT_NAME, STATUS, LAST_EXECUTED, NEXT_EXECUTION
FROM information_schema.EVENTS
WHERE EVENT_SCHEMA = '3moviecollectors';
```

### Disable an Event

```sql
ALTER EVENT send_event_reminders DISABLE;
ALTER EVENT auto_complete_events DISABLE;
ALTER EVENT cleanup_old_notifications DISABLE;
```

### Enable an Event

```sql
ALTER EVENT send_event_reminders ENABLE;
ALTER EVENT auto_complete_events ENABLE;
ALTER EVENT cleanup_old_notifications ENABLE;
```

### Drop an Event

```sql
DROP EVENT IF EXISTS send_event_reminders;
DROP EVENT IF EXISTS auto_complete_events;
DROP EVENT IF EXISTS cleanup_old_notifications;
```

## Server Integration

The Node.js server (`server/scheduler.js`) now:

1. Checks if MySQL Event Scheduler is enabled on startup
2. Automatically enables it if disabled (requires SUPER privilege)
3. Logs the status of all scheduled events
4. Does NOT run its own cron jobs - everything is handled by MySQL

## Benefits of MySQL Event Scheduler

✅ **Native MySQL Integration**: Runs directly in the database  
✅ **Independent of Application**: Events run even if Node.js app is down  
✅ **Better Performance**: No Node.js overhead for scheduled tasks  
✅ **Persistent**: Survives application restarts  
✅ **Transaction-safe**: Uses MySQL's transaction handling  
✅ **Maximum MySQL Usage**: Aligns with project goal to use MySQL as much as possible

## Troubleshooting

### Event Scheduler Not Starting

Check if you have SUPER privilege:

```sql
SHOW GRANTS FOR CURRENT_USER();
```

If not, ask your DBA to enable it:

```sql
SET GLOBAL event_scheduler = ON;
```

### Events Not Executing

1. Check if Event Scheduler is ON:

```sql
SHOW VARIABLES LIKE 'event_scheduler';
```

2. Check for errors in MySQL error log

3. Verify event status:

```sql
SHOW EVENTS;
```

### Testing Events Manually

You can test the event logic by directly calling the stored procedure code within a BEGIN...END block. Just copy the logic from `event_scheduler.sql` and execute it.

## Migration from node-cron

**Before**: Used `node-cron` package with 3 JavaScript cron jobs  
**After**: Uses MySQL Event Scheduler with 3 native MySQL events  
**No functionality lost**: All features work identically  
**Removed dependency**: Can uninstall `node-cron` from package.json
