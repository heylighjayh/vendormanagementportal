-- AlterTable
ALTER TABLE "OnboardingDocumentTemplate"
ADD COLUMN "description" TEXT,
ADD COLUMN "templateStoragePath" TEXT NOT NULL,
ADD COLUMN "uploadedById" TEXT;

-- AddForeignKey
ALTER TABLE "OnboardingDocumentTemplate"
ADD CONSTRAINT "OnboardingDocumentTemplate_uploadedById_fkey"
FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
