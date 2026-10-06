import { Search } from 'lucide-react'

export default function SearchBar({ value, onChange, onSubmit, placeholder = 'Search...' }) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.(value)
      }}
      className="flex w-full items-center gap-3 rounded-full border border-emerald-200 bg-white px-4 py-3 shadow-sm ring-0 transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900"
    >
      <Search className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
      />
    </form>
  )
}
