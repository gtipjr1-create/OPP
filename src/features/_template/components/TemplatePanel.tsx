'use client';

import { useState } from 'react';

import { useTemplateFeature } from '../useTemplateFeature';

export default function TemplatePanel() {
  const [label, setLabel] = useState('');
  const { items, isLoading, error, hasItems, addItem } = useTemplateFeature();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await addItem(label);
    setLabel('');
  };

  return (
    <section>
      <h2>Template Feature</h2>
      <form onSubmit={handleSubmit}>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Add item"
        />
        <button type="submit">Add</button>
      </form>

      {isLoading ? <p>Loading...</p> : null}
      {error ? <p>{error}</p> : null}
      {!isLoading && !hasItems ? <p>No items yet.</p> : null}

      <ul>
        {items.map((item) => (
          <li key={item.id}>{item.label}</li>
        ))}
      </ul>
    </section>
  );
}
