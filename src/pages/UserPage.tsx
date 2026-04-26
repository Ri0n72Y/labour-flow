import {
  DocumentArrowDownIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import type { ChangeEvent } from 'react'
import { useState } from 'react'
import { GitHubIcon } from '../components/icons/GitHubIcon'
import { KeyIcon } from '../components/icons/KeyIcon'
import { useLaborStore } from '../stores/laborStore'
import { useUserStore } from '../stores/userStore'
import { isEd25519KeyPair, publicKeyLabel } from '../utils/crypto'
import { formatDate } from '../utils/time'

export function UserPage() {
  const user = useUserStore()
  const records = useLaborStore((state) => state.records)
  const exportJson = useLaborStore((state) => state.exportJson)
  const [uidDraft, setUidDraft] = useState(user.uid)
  const [keyMessage, setKeyMessage] = useState('')
  const [profileMessage, setProfileMessage] = useState('')
  const hasKeys = isEd25519KeyPair(user.publicKeyJwk, user.privateKeyJwk)
  const displayId = `${user.uid || 'worker'}#${publicKeyLabel(user.publicKeyJwk)}`
  const cleanUidDraft = uidDraft.trim() || 'worker'
  const uidChanged = cleanUidDraft !== user.uid

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => user.setAvatarDataUrl(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  }

  const handleSaveUid = () => {
    user.setUid(uidDraft)
    setUidDraft(cleanUidDraft)
    setProfileMessage('名称已保存，完整身份已更新。')
  }

  const handleGenerateKeys = async () => {
    setKeyMessage('')
    try {
      await user.generateKeys()
      setKeyMessage('密钥已生成并保存在本地。')
    } catch (error) {
      setKeyMessage(
        error instanceof Error
          ? error.message
          : '密钥生成失败，请确认正在使用 HTTPS。'
      )
    }
  }

  const handleExport = () => {
    const publicUser = {
      uid: user.uid,
      displayId,
      publicKeyJwk: user.publicKeyJwk,
    }
    const blob = new Blob([exportJson(publicUser)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `labourflow-${formatDate(new Date())}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4 text-left">
      {!hasKeys && (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">还没有完成注册</p>
          <p className="mt-1 text-sm text-amber-800">
            生成密钥后，LabourFlow
            才能为劳动记录签名并确认记录属于你。你可以点击右上角“注册”快捷完成。
          </p>
        </section>
      )}

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-stone-100">
            {user.avatarDataUrl ? (
              <img
                className="h-full w-full object-cover"
                src={user.avatarDataUrl}
                alt="用户头像"
              />
            ) : (
              <UserCircleIcon className="h-12 w-12 text-stone-400" />
            )}
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={handleAvatar}
            />
          </label>
          <div className="min-w-0 flex-1">
            <label className="text-sm font-medium text-stone-600">
              用户名
              <input
                className="input mt-1"
                value={uidDraft}
                onChange={(event) => {
                  setUidDraft(event.target.value)
                  setProfileMessage('')
                }}
              />
            </label>
            <button
              className="mt-2 h-10 w-full rounded-md bg-teal-700 px-3 text-sm font-semibold text-white disabled:bg-stone-300"
              disabled={!uidChanged}
              type="button"
              onClick={handleSaveUid}
            >
              保存
            </button>
            {profileMessage && (
              <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {profileMessage}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 rounded-md bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            完整身份
          </p>
          <p className="mt-1 break-all text-sm text-stone-950">{displayId}</p>
        </div>
      </section>

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-950">密钥管理</h2>
        <p className="mt-2 text-sm text-stone-500">
          公钥前八位：{publicKeyLabel(user.publicKeyJwk)}
        </p>
        <button
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white"
          type="button"
          onClick={handleGenerateKeys}
        >
          <KeyIcon />
          生成 / 重新生成密钥
        </button>
        {keyMessage && (
          <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {keyMessage}
          </p>
        )}
      </section>

      <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-950">数据导出</h2>
        <p className="mt-2 text-sm text-stone-500">
          当前共有 {records.length} 条已签名劳动记录。
        </p>
        <button
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-semibold text-white"
          type="button"
          onClick={handleExport}
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          导出 JSON
        </button>
      </section>

      <a
        className="mx-auto flex w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
        href="https://github.com/Ri0n72Y/labour-flow"
        rel="noreferrer"
        target="_blank"
      >
        <GitHubIcon />
      </a>
    </div>
  )
}
