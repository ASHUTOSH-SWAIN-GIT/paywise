!/bin/bash

# Navigate to the project root
cd /home/ash/paywise

echo "🔄 Generating Prisma client..."
npx prisma generate --schema=./db/prisma/schema.prisma

echo "🔄 Pushing schema to database..."
npx prisma db push --schema=./db/prisma/schema.prisma

echo "✅ Database setup complete!"
echo "You can now test your split functionality."
