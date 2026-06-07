import React from 'react'

type Props = {
  placeholder?: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
}

export default function SearchBox({ placeholder = 'Enter BL Number', value, onChange, onSubmit }: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <input
        className="w-full p-4 rounded shadow-md border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </form>
  )
}
