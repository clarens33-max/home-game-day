import { useRef } from 'react'
import { Image, Type, Trash2, ArrowUp, ArrowDown, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

// ── BlockEditor ───────────────────────────────────────────────────────────────

export default function BlockEditor({ blocks, onChange }) {
  const fileRefs = useRef({})

  const update = (i, patch) => {
    const next = blocks.map((b, idx) => idx === i ? { ...b, ...patch } : b)
    onChange(next)
  }

  const remove = (i) => onChange(blocks.filter((_, idx) => idx !== i))

  const moveUp = (i) => {
    if (i === 0) return
    const next = [...blocks]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onChange(next)
  }

  const moveDown = (i) => {
    if (i === blocks.length - 1) return
    const next = [...blocks]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    onChange(next)
  }

  const addText = () => onChange([...blocks, { type: 'text', value: '' }])
  const addImage = () => onChange([...blocks, { type: 'image', url: '', caption: '' }])

  const handleFileChange = (i, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    const reader = new FileReader()
    reader.onload = (ev) => update(i, { url: ev.target.result })
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => (
        <div key={i} className="border border-[#EAEAE4] rounded-xl overflow-hidden bg-white">
          {/* Block header */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F7F5] border-b border-[#EAEAE4]">
            {block.type === 'text'
              ? <><Type size={12} className="text-[#999]" /><span className="text-xs text-[#999] flex-1">Text</span></>
              : <><Image size={12} className="text-[#E91E8C]" /><span className="text-xs text-[#E91E8C] flex-1">Image</span></>
            }
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => moveUp(i)} disabled={i === 0}
                className="p-1 text-[#ccc] hover:text-[#666] disabled:opacity-30 transition-colors">
                <ArrowUp size={12} />
              </button>
              <button type="button" onClick={() => moveDown(i)} disabled={i === blocks.length - 1}
                className="p-1 text-[#ccc] hover:text-[#666] disabled:opacity-30 transition-colors">
                <ArrowDown size={12} />
              </button>
              <button type="button" onClick={() => remove(i)}
                className="p-1 text-[#ccc] hover:text-red-500 transition-colors ml-1">
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Block body */}
          <div className="p-3">
            {block.type === 'text' ? (
              <textarea
                value={block.value}
                onChange={e => update(i, { value: e.target.value })}
                rows={4}
                placeholder="Write text here…"
                className="w-full text-sm focus:outline-none resize-y text-[#1C1C1C] placeholder:text-[#ccc]"
              />
            ) : (
              <div className="space-y-2">
                {block.url ? (
                  <div className="space-y-1.5">
                    <img src={block.url} alt="preview" className="w-full max-h-48 object-cover rounded-lg border border-[#EAEAE4]" />
                    <button type="button" onClick={() => { update(i, { url: '' }); if (fileRefs.current[i]) fileRefs.current[i].value = '' }}
                      className="text-xs text-red-500 hover:underline">
                      Remove image
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileRefs.current[i]?.click()}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[#EAEAE4] rounded-lg p-5 cursor-pointer hover:border-[#E91E8C] hover:bg-[#fdf5f9] transition-colors"
                  >
                    <Image size={20} className="text-[#ccc]" />
                    <span className="text-xs text-[#999]">Click to upload image (max 5 MB)</span>
                  </div>
                )}
                <input
                  ref={el => { fileRefs.current[i] = el }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileChange(i, e)}
                />
                <input
                  value={block.caption ?? ''}
                  onChange={e => update(i, { caption: e.target.value })}
                  placeholder="Caption (optional) — e.g. Photo of the accessible toilet"
                  className="w-full text-xs border border-[#EAEAE4] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E91E8C]"
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add block buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={addText}
          className="flex items-center gap-1.5 text-xs font-medium text-[#666] border border-[#EAEAE4] rounded-lg px-3 py-1.5 hover:border-[#E91E8C] hover:text-[#E91E8C] transition-colors bg-white"
        >
          <Plus size={11} /><Type size={11} /> Add text
        </button>
        <button
          type="button"
          onClick={addImage}
          className="flex items-center gap-1.5 text-xs font-medium text-[#666] border border-[#EAEAE4] rounded-lg px-3 py-1.5 hover:border-[#E91E8C] hover:text-[#E91E8C] transition-colors bg-white"
        >
          <Plus size={11} /><Image size={11} /> Add image
        </button>
      </div>
    </div>
  )
}
