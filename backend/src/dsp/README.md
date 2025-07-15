# DSP Management System

This module manages Digital Service Providers (DSPs) for the N3RVE platform.

## Features

- Complete CRUD operations for DSPs
- Search and filtering by service type, status, and text
- Statistics and analytics
- Bulk import/update functionality
- Admin-only access controls

## Database Schema

The DSP model includes:
- `dspId`: Unique FUGA identifier
- `name`: DSP name
- `code`: Short code (e.g., "A", "via IIP-DDS")
- `description`: Detailed description
- `contactEmail`: Contact information
- `territories`: Supported territories
- `availability`: Availability status
- `isActive`: Active/inactive status
- `isHD`: HD audio support
- `serviceType`: Service classification

## Service Types

- `STREAMING`: Music streaming services
- `DOWNLOAD`: Download stores
- `VIDEO`: Video platforms
- `RADIO`: Radio services
- `SOCIAL`: Social media platforms
- `FINGERPRINTING`: Content identification
- `OTHER`: Other services

## Seeding Data

To populate the database with the initial 65 DSPs:

```bash
# From the backend directory
cd backend
npx tsx src/dsp/seed-dsps.ts
```

This will:
- Insert all 65 DSPs from the provided list
- Automatically determine service types
- Set HD flags for HD audio services
- Show statistics after completion

## API Endpoints

### Public (Authenticated)
- `GET /dsp` - List DSPs with filtering
- `GET /dsp/statistics` - Get DSP statistics
- `GET /dsp/:id` - Get single DSP

### Admin Only
- `POST /dsp` - Create new DSP
- `POST /dsp/bulk` - Bulk create/update DSPs
- `PUT /dsp/:id` - Update DSP
- `DELETE /dsp/:id` - Deactivate DSP (soft delete)

## Frontend Components

- `DSPList.tsx` - Main DSP management interface
- Displays statistics, search/filter options
- Shows service type icons and categories
- Admin controls for CRUD operations

## Adding/Removing DSPs

To add new DSPs:
1. Update `dsp-seed-data.ts` with new entries
2. Run the seeder script
3. Or use the admin API endpoints

To remove DSPs:
- Use soft delete (set `isActive: false`)
- DSPs are never permanently deleted for audit purposes

## Maintenance

The DSP list can be updated at any time:
- New DSPs can be added via API or seeder
- Existing DSPs can be updated via API
- Inactive DSPs are preserved for historical data