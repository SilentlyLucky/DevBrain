import { getFolders, getDocumentsWithFolders } from '@/lib/dal'
import { DropZone } from '@/components/knowledge/DropZone'
import { KnowledgeBase } from '@/components/knowledge/KnowledgeBase'

export default async function KnowledgePage() {
  const [folders, documents] = await Promise.all([
    getFolders(),
    getDocumentsWithFolders(),
  ])

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload your documents to build a personal knowledge base. Ask questions, get summaries, and surface insights powered by AI.
        </p>
      </div>

      <DropZone folders={folders} />

      <KnowledgeBase folders={folders} documents={documents} />
    </div>
  )
}
