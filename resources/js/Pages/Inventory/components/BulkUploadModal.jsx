import { useState, useRef } from 'react'
import { UploadCloud, FileText, Download, CheckCircle2, AlertCircle, X } from 'lucide-react'
import {
    Dialog, DialogContent, DialogHeader,
    DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button }   from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { downloadCsvTemplate } from '../helpers/inventoryHelpers'
import { cn } from '@/lib/utils'

const ACCEPTED = '.csv,.txt'
const MAX_MB   = 5

export default function BulkUploadModal({ open, onOpenChange, onUpload, uploading }) {
    const [file,     setFile]     = useState(null)
    const [progress, setProgress] = useState(0)
    const [result,   setResult]   = useState(null)  // { created, updated, errors[] }
    const [fileError,setFileError]= useState(null)
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef(null)

    const resetState = () => {
        setFile(null)
        setProgress(0)
        setResult(null)
        setFileError(null)
    }

    const handleClose = () => {
        if (!uploading) {
            resetState()
            onOpenChange(false)
        }
    }

    const validateFile = (f) => {
        if (!f) return 'No file selected.'
        if (f.size > MAX_MB * 1024 * 1024) return `File is too large (max ${MAX_MB} MB).`
        const ext = f.name.split('.').pop()?.toLowerCase()
        if (!['csv', 'txt'].includes(ext)) return 'Only CSV (.csv, .txt) files are accepted.'
        return null
    }

    const pickFile = (f) => {
        const err = validateFile(f)
        setFileError(err)
        setResult(null)
        setFile(err ? null : f)
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) pickFile(f)
    }

    const handleUpload = async () => {
        if (!file || uploading) return
        setResult(null)
        try {
            const res = await onUpload(file, setProgress)
            setResult(res)
            setFile(null)
        } catch {
            // Error toast from hook
        } finally {
            setProgress(0)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UploadCloud className="h-5 w-5" />
                        Bulk Upload Inventory
                    </DialogTitle>
                    <DialogDescription>
                        Import multiple items at once using a CSV file.
                        Rows with an existing ID will be updated; others will be created.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Template download */}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={downloadCsvTemplate}
                        className="w-full gap-2"
                    >
                        <Download className="h-4 w-4" />
                        Download CSV Template
                    </Button>

                    {/* Drop zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => inputRef.current?.click()}
                        className={cn(
                            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                            dragging
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/60 hover:bg-muted/30',
                            uploading && 'pointer-events-none opacity-60'
                        )}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            accept={ACCEPTED}
                            className="hidden"
                            onChange={(e) => pickFile(e.target.files[0])}
                        />

                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileText className="h-8 w-8 text-primary" />
                                <p className="text-sm font-medium truncate max-w-full px-4">
                                    {file.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                                {!uploading && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); resetState() }}
                                        className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 mt-1"
                                    >
                                        <X className="h-3 w-3" /> Remove
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                <UploadCloud className="h-10 w-10" />
                                <p className="text-sm font-medium">
                                    Drop your CSV here, or{' '}
                                    <span className="text-primary">browse</span>
                                </p>
                                <p className="text-xs">
                                    CSV or TXT, max {MAX_MB} MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* File validation error */}
                    {fileError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{fileError}</AlertDescription>
                        </Alert>
                    )}

                    {/* Upload progress */}
                    {uploading && progress > 0 && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Uploading…</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} />
                        </div>
                    )}

                    {/* Result summary */}
                    {result && (
                        <Alert variant={result.errors?.length ? 'warning' : 'success'}>
                            {result.errors?.length
                                ? <AlertCircle   className="h-4 w-4" />
                                : <CheckCircle2  className="h-4 w-4" />
                            }
                            <AlertTitle>
                                {result.errors?.length ? 'Import completed with warnings' : 'Import successful'}
                            </AlertTitle>
                            <AlertDescription className="space-y-1">
                                <p>
                                    <strong>{result.created}</strong> created,{' '}
                                    <strong>{result.updated}</strong> updated
                                </p>
                                {result.errors?.length > 0 && (
                                    <ul className="list-disc pl-4 text-xs space-y-0.5 mt-1">
                                        {result.errors.slice(0, 5).map((e, i) => (
                                            <li key={i}>{e}</li>
                                        ))}
                                        {result.errors.length > 5 && (
                                            <li>…and {result.errors.length - 5} more</li>
                                        )}
                                    </ul>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={uploading}
                    >
                        {result ? 'Close' : 'Cancel'}
                    </Button>
                    {!result && (
                        <Button
                            type="button"
                            onClick={handleUpload}
                            disabled={!file || uploading || !!fileError}
                            className="gap-2"
                        >
                            <UploadCloud className="h-4 w-4" />
                            {uploading ? 'Uploading…' : 'Upload'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
