import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function SearchBar({ value, onChange, onNavigate, placeholder = 'জেলা বা টুল খুঁজুন', results = [] }) {
  const navigate = useNavigate()

  function openResult(to) {
    navigate(to)
    onChange('')
    onNavigate?.()
  }

  function submit(event) {
    event.preventDefault()
    if (results[0]) openResult(results[0].to)
  }

  return (
    <div className="search-wrap">
      <form onSubmit={submit} className="search-form" role="search">
        <Search size={17} aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label="জেলা বা টুল খুঁজুন"
          aria-expanded={Boolean(value && results.length)}
        />
        <kbd>↵</kbd>
      </form>
      {value.trim() && (
        <div className="search-results">
          {results.length ? results.map((result) => (
            <button
              type="button"
              key={result.to}
              onClick={() => openResult(result.to)}
              className="search-result"
            >
              <span><strong>{result.label}</strong><small>{result.description}</small></span>
              <em>{result.type}</em>
            </button>
          )) : <p className="search-empty">কোনো জেলা বা টুল পাওয়া যায়নি।</p>}
        </div>
      )}
    </div>
  )
}
