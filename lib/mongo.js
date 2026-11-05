import { MongoClient } from 'mongodb';

export async function reportsCol() {
  if (!globalThis._mongo) {
    globalThis._mongo = new MongoClient(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 }).connect();
  }
  const client = await globalThis._mongo;
  return client.db(process.env.MONGO_DB).collection('field_reports');
}

// MongoDB aggregation pipeline: summary of field reports by type
export async function reportStats() {
  const col = await reportsCol();
  return col
    .aggregate([
      {
        $group: {
          _id: '$reportType',
          reports: { $sum: 1 },
          avgSeverity: { $avg: '$severity' },
          totalAffected: { $sum: { $ifNull: ['$details.affectedPeople', 0] } },
        },
      },
      { $project: { _id: 0, reportType: '$_id', reports: 1, totalAffected: 1, avgSeverity: { $round: ['$avgSeverity', 1] } } },
      { $sort: { reports: -1 } },
    ])
    .toArray();
}
