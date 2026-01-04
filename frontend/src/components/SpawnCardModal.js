import React, { useState, useEffect } from 'react';
import '../styles/SpawnCardModal.css';

const SpawnCardModal = ({ isOpen, onClose, onSpawn, position }) => {
  const [setCode, setSetCode] = useState('');
  const [collectorNumber, setCollectorNumber] = useState('');
  const [cardPreview, setCardPreview] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleQueryCard = async () => {
    if (!setCode.trim() || !collectorNumber.trim()) {
      setError('Please enter both set code and collector number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/cards/query?set_code=${setCode.trim()}&collector_number=${collectorNumber.trim()}`);
      const data = await response.json();

      if (data.found) {
        setCardPreview(data);
      } else {
        setError('Card not found in database');
        setCardPreview(null);
      }
    } catch (err) {
      setError('Failed to query card: ' + err.message);
      setCardPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: query });
      if (setCode.trim()) {
        params.append('set_code', setCode.trim());
      }

      const response = await fetch(`/cards/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.cards);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCard = (card) => {
    // Extract set code from the collector number context or use current set code
    setCollectorNumber(card.collector_number);
    setSearchQuery('');
    setSearchResults([]);
    handleQueryCard();
  };

  const handleSpawn = () => {
    if (cardPreview && cardPreview.found) {
      onSpawn({
        setCode: setCode.trim(),
        collectorNumber: collectorNumber.trim(),
        imagePath: cardPreview.image_path,
        name: cardPreview.name,
        isTwoSided: cardPreview.is_two_sided,
        position: position
      });
      
      // Reset form
      setSetCode('');
      setCollectorNumber('');
      setSearchQuery('');
      setCardPreview(null);
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="spawn-card-modal-overlay" onClick={onClose}>
      <div className="spawn-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="spawn-card-header">
          <h2>Spawn Card</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="spawn-card-body">
          {/* Set Code Input */}
          <div className="form-group">
            <label>Set Code</label>
            <input
              type="text"
              placeholder="e.g., mh3, lci, otj"
              value={setCode}
              onChange={(e) => setSetCode(e.target.value)}
              maxLength="10"
            />
          </div>

          {/* Collector Number Input */}
          <div className="form-group">
            <label>Collector Number</label>
            <input
              type="text"
              placeholder="e.g., 123, 45b"
              value={collectorNumber}
              onChange={(e) => setCollectorNumber(e.target.value)}
            />
          </div>

          {/* Card Search */}
          <div className="form-group">
            <label>Card Name (Search)</label>
            <input
              type="text"
              placeholder="Search for cards..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((card, idx) => (
                  <div 
                    key={idx} 
                    className="search-result-item"
                    onClick={() => handleSelectCard(card)}
                  >
                    <strong>{card.name}</strong> - #{card.collector_number}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Query Button */}
          <button 
            className="query-btn"
            onClick={handleQueryCard}
            disabled={loading || !setCode.trim() || !collectorNumber.trim()}
          >
            {loading ? 'Searching...' : 'Query Card'}
          </button>

          {/* Error Message */}
          {error && <div className="error-message">{error}</div>}

          {/* Card Preview */}
          {cardPreview && cardPreview.found && (
            <div className="card-preview">
              <h3>{cardPreview.name}</h3>
              <div className="card-image-container">
                <img 
                  src={cardPreview.image_path} 
                  alt={cardPreview.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML += '<p style="color: #ff6b6b;">Image not available</p>';
                  }}
                />
                {cardPreview.is_two_sided && (
                  <p style={{ color: '#60a5fa', marginTop: '8px' }}>
                    ✓ Two-sided card detected
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="spawn-card-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-spawn"
            onClick={handleSpawn}
            disabled={!cardPreview || !cardPreview.found}
          >
            Spawn Card
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpawnCardModal;
