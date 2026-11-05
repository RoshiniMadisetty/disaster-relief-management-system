import { query } from '@/lib/db';
import { withAuth } from '@/lib/auth';

// Dropdown data for forms
export const GET = withAuth(null, async () =>
  Response.json({
    disasters: await query('SELECT Disaster_ID, Disaster_Name FROM Disaster ORDER BY Disaster_ID DESC'),
    centers: await query('SELECT Center_ID, Center_Name FROM Relief_Center ORDER BY Center_Name'),
    resources: await query('SELECT Resource_ID, Resource_Name, Unit FROM Resource ORDER BY Resource_Name'),
    beneficiaries: await query('SELECT Beneficiary_ID, Beneficiary_Name FROM Beneficiary ORDER BY Beneficiary_Name'),
  })
);
