import React from 'react'

export default function AssociatesLoading() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      <div>
        <div className="h-8 w-64 bg-slate-200 rounded-lg mb-2"></div>
        <div className="h-4 w-48 bg-slate-100 rounded-lg"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="p-6 border border-slate-100 rounded-[2rem] bg-white h-72">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="h-6 w-32 bg-slate-200 rounded-lg mb-2"></div>
                <div className="h-4 w-24 bg-slate-100 rounded-lg"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="h-4 w-full bg-slate-100 rounded-lg"></div>
              <div className="h-4 w-full bg-slate-100 rounded-lg"></div>
              <div className="h-4 w-full bg-slate-100 rounded-lg"></div>
              <div className="h-4 w-full bg-slate-100 rounded-lg"></div>
            </div>
            <div className="h-24 w-full bg-slate-50 rounded-xl mb-4"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
