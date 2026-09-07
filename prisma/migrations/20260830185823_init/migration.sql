-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boardId" TEXT NOT NULL,
    "sourcePlatform" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "fetchMethod" TEXT NOT NULL,
    "embedHtml" TEXT,
    "thumbnailUrl" TEXT,
    "title" TEXT,
    "notes" TEXT,
    "tested" BOOLEAN NOT NULL DEFAULT false,
    "performanceNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SavedItem_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_SavedItemToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_SavedItemToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "SavedItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SavedItemToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "SavedItem_boardId_idx" ON "SavedItem"("boardId");

-- CreateIndex
CREATE INDEX "SavedItem_tested_idx" ON "SavedItem"("tested");

-- CreateIndex
CREATE INDEX "SavedItem_sourcePlatform_idx" ON "SavedItem"("sourcePlatform");

-- CreateIndex
CREATE UNIQUE INDEX "_SavedItemToTag_AB_unique" ON "_SavedItemToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_SavedItemToTag_B_index" ON "_SavedItemToTag"("B");
