'use client'

import { Fragment } from 'react'
import { BranchBlock, BRANCH_OPTION_COLOR_CLASSES } from '@/types/scenario'
import { useBranchView } from './BranchViewContext'

interface Props {
  branch: BranchBlock
  /** true のとき、下のブロックへ向かうマージコネクターを描画する */
  hasNextBlock?: boolean
  /** 省略時は setBranchView（スタックリセット＋push）。ネスト分岐では pushBranchView を渡す */
  onNavigate?: (side: string) => void
  /** true のとき、合流ヒントと共通処理枠を非表示にする */
  hideMergeHint?: boolean
}

/** 条件分岐ブロックの下に N 個のナビゲーションボタンを描画する */
export default function BranchSplit({ branch, hasNextBlock = false, onNavigate, hideMergeHint = false }: Props) {
  const { setBranchView } = useBranchView()
  const navigate = onNavigate ?? ((side: string) => setBranchView({ branchId: branch.id, side }))
  const n = branch.options.length

  return (
    <div className="mt-1">
      {/* ── 分岐コネクター（ブランチブロック → Nカラム） ── */}
      <div className="flex justify-center">
        <div className="w-px h-3 bg-gray-300" />
      </div>
      <div className="relative flex items-start">
        {/* 横線（分岐の入口） */}
        {n > 1 && (
          <div
            className="absolute top-0 h-px bg-gray-300"
            style={{
              left: `${((0.5 / n) * 100).toFixed(1)}%`,
              right: `${((0.5 / n) * 100).toFixed(1)}%`,
            }}
          />
        )}

        {/* オプションボタン */}
        {branch.options.map((opt) => {
          const cls = BRANCH_OPTION_COLOR_CLASSES[opt.color]
          return (
            <div key={opt.id} className="flex-1 flex flex-col items-center px-1">
              <div className="w-px h-3 bg-gray-300" />
              <button
                data-branch-navigate="true"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => navigate(opt.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-colors select-none ${cls.bg} ${cls.border} ${cls.text} ${cls.hover} ${cls.active}`}
              >
                {opt.label} →
              </button>
            </div>
          )
        })}
      </div>

      {/* ── マージコネクター ── */}
      {hasNextBlock ? (
        <div className="select-none pointer-events-none">
          <svg width="100%" height="24" className="block">
            {branch.options.map((_, i) => {
              const x = `${(((i + 0.5) / n) * 100).toFixed(1)}%`
              return (
                <Fragment key={i}>
                  <line x1={x} y1="0"  x2={x}    y2="12" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1={x} y1="12" x2="50%"  y2="12" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
                </Fragment>
              )
            })}
            <line x1="50%" y1="12" x2="50%" y2="24" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="flex justify-center -mt-px">
            <svg width="10" height="6" viewBox="0 0 10 6" className="fill-gray-300">
              <path d="M5 6L0 0h10z" />
            </svg>
          </div>
          <div className="flex justify-center mt-0.5">
            <div className="w-px h-2 bg-gray-300" />
          </div>
        </div>
      ) : (
        /* 次のブロックがない場合：合流コネクター（ヒントはオプション） */
        <div className="flex flex-col items-center mt-2 select-none pointer-events-none">
          <svg width="100%" height="16" className="block">
            {branch.options.map((_, i) => {
              const x = `${(((i + 0.5) / n) * 100).toFixed(1)}%`
              return (
                <Fragment key={i}>
                  <line x1={x} y1="0"  x2={x}    y2="8"  stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1={x} y1="8"  x2="50%"  y2="8"  stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
                </Fragment>
              )
            })}
            <line x1="50%" y1="8" x2="50%" y2="16" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {!hideMergeHint && (
            <>
              <span className="text-[9px] text-gray-400 font-medium tracking-wide mt-0.5">合流 ↓</span>
              <div className="mt-1 px-3 py-1 rounded border border-dashed border-gray-300 text-[9px] text-gray-400">
                共通処理はここにブロックを追加
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
