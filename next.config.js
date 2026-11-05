/** @type {import('next').NextConfig} */
module.exports = {
  experimental: { serverComponentsExternalPackages: ['mongodb', 'mysql2', 'bcryptjs'] },
};
