'use client'

import { useMemo, useState } from 'react'

type Category = {
  id: string
  name: string
}

type Props = {
  albumId: string
  categories?: Category[]
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(2)} GB`
}

export default function UploadPhotoForm({
  albumId,
  categories = [],
}: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [size, setSize] = useState('original')
  const [categoryId, setCategoryId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [completedCount, setCompletedCount] = useState(0)
  const [currentFileName, setCurrentFileName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [upgradePopup, setUpgradePopup] = useState<{
    type: 'warning' | 'blocked'
    usagePercent: number
    planName: string
    willUseBytes: number
    limitBytes: number
  } | null>(null)

  const totalSelectedBytes = useMemo(() => {
    return files.reduce((sum, file) => sum + file.size, 0)
  }, [files])

  const progress = useMemo(() => {
    if (!files.length) return 0
    return Math.round((completedCount / files.length) * 100)
  }, [completedCount, files.length])

  async function checkStorageBeforeUpload() {
    const res = await fetch('/api/storage/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadSizeBytes: totalSelectedBytes }),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      if (data?.blocked) {
        setUpgradePopup({
          type: 'blocked',
          usagePercent: data.usagePercent || 100,
          planName: data.planName || 'Current Plan',
          willUseBytes: data.willUseBytes || 0,
          limitBytes: data.limitBytes || 0,
        })
      }

      throw new Error(data?.error || 'Storage limit check failed')
    }

    if (data?.warning) {
      setUpgradePopup({
        type: 'warning',
        usagePercent: data.usagePercent || 80,
        planName: data.planName || 'Current Plan',
        willUseBytes: data.willUseBytes || 0,
        limitBytes: data.limitBytes || 0,
      })
    }

    return data
  }

  async function handleUpload() {
    setErrorMsg('')
    setSuccessMsg('')

    if (files.length === 0) {
      setErrorMsg('Please select at least one JPG file')
      return
    }

    const invalidFile = files.find((file) => {
      return !(
        file.type === 'image/jpeg' ||
        file.name.toLowerCase().endsWith('.jpg') ||
        file.name.toLowerCase().endsWith('.jpeg')
      )
    })

    if (invalidFile) {
      setErrorMsg('Only JPG/JPEG files are allowed')
      return
    }

    try {
      setUploading(true)
      setCompletedCount(0)
      setCurrentFileName('Checking storage...')

      await checkStorageBeforeUpload()

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCurrentFileName(file.name)

        const formData = new FormData()
        formData.append('file', file)
        formData.append('albumId', albumId)
        formData.append('size', size)

        if (categoryId) {
          formData.append('categoryId', categoryId)
        }

        const res = await fetch('/api/photos/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json().catch(() => null)

        if (!res.ok) {
          const message = data?.error || `Upload failed for ${file.name}`
          setErrorMsg(message)

          if (message.includes('Storage full')) {
            setUpgradePopup({
              type: 'blocked',
              usagePercent: 100,
              planName: 'Current Plan',
              willUseBytes: 0,
              limitBytes: 0,
            })
          }

          return
        }

        setCompletedCount(i + 1)
      }

      setSuccessMsg(`Upload complete: ${files.length} file(s) uploaded`)
      setFiles([])
      setCategoryId('')
      setCurrentFileName('')
      window.location.reload()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      setErrorMsg(message)
      setCurrentFileName('')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="space-y-4 rounded-3xl bg-white p-4 shadow-sm">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Upload Photos
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload JPG files and assign a category before sending
          </p>
        </div>

        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,image/jpeg"
          onChange={(e) => {
            setFiles(Array.from(e.target.files || []))
            setCompletedCount(0)
            setCurrentFileName('')
            setErrorMsg('')
            setSuccessMsg('')
            setUpgradePopup(null)
          }}
          className="block w-full text-sm text-slate-600"
          disabled={uploading}
        />

        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-3"
          disabled={uploading}
        >
          <option value="sd">SD (2000px)</option>
          <option value="hd">HD (3000px)</option>
          <option value="uhd">UHD (4000px)</option>
          <option value="original">Original</option>
        </select>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 p-3"
          disabled={uploading}
        >
          <option value="">No Category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {files.length > 0 ? (
          <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
            <div>Selected {files.length} file(s)</div>
            <div className="mt-1 text-xs text-slate-400">
              Total size: {formatBytes(totalSelectedBytes)}
            </div>
          </div>
        ) : null}

        {(uploading || completedCount > 0) && files.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {uploading
                  ? `Uploading ${completedCount}/${files.length}`
                  : `Uploaded ${completedCount}/${files.length}`}
              </span>
              <span>{progress}%</span>
            </div>

            {currentFileName ? (
              <p className="truncate text-xs text-slate-400">
                Current: {currentFileName}
              </p>
            ) : null}

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : null}

        {errorMsg ? <p className="text-sm text-red-500">{errorMsg}</p> : null}

        {successMsg ? (
          <p className="text-sm text-green-600">{successMsg}</p>
        ) : null}

        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full rounded-xl bg-blue-600 py-3 text-white disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      {upgradePopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl">
              {upgradePopup.type === 'blocked' ? '🚫' : '⚠️'}
            </div>

            <h2 className="mt-4 text-center text-xl font-bold text-slate-900">
              {upgradePopup.type === 'blocked'
                ? 'Storage is full'
                : 'Storage almost full'}
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-slate-500">
              Your {upgradePopup.planName} will reach about{' '}
              <span className="font-semibold text-slate-900">
                {upgradePopup.usagePercent}%
              </span>{' '}
              after this upload.
            </p>

            {upgradePopup.limitBytes > 0 ? (
              <p className="mt-3 text-center text-xs text-slate-400">
                {formatBytes(upgradePopup.willUseBytes)} /{' '}
                {formatBytes(upgradePopup.limitBytes)}
              </p>
            ) : null}

            <div className="mt-5 flex gap-2">
              {upgradePopup.type === 'warning' ? (
                <button
                  type="button"
                  onClick={() => setUpgradePopup(null)}
                  className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  Continue
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  window.location.href = '/pricing'
                }}
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-medium text-white"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}