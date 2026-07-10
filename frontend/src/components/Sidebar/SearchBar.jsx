import React from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';

export default function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="sidebar-search">
      <div className="search-input-wrapper">
        <TextInput
          size="lg"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="search-input"
        />
      </div>
    </div>
  );
}
