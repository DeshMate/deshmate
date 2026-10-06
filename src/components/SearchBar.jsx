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
          {results.length ? [...new Set(results.map((result) => result.type))].map((type) => (
            <section className="search-result-group" key={type}>
              <h2 className="search-result-group-title">{type}</h2>
              {results.filter((result) => result.type === type).map((result, index) => (
                <button
                  type="button"
                  key={`${result.to}-${result.label}-${index}`}
                  onClick={() => openResult(result.to)}
                  className="search-result"
                >
                  <span><strong>{result.label}</strong><small>{result.description}</small></span>
                </button>
              ))}
            </section>
          )) : <p className="search-empty">কোনো জেলা, জায়গা, খাবার বা টুল পাওয়া যায়নি।</p>}
        </div>
      )}
    </div>
  )
}
