import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminMarketUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

        </button>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </form>
      <ul className="divide-y divide-gray-300">
        {updates.map(update => (
          <li key={update._id} className="py-2 flex justify-between items-center">
            <div>
              <div className="font-semibold">{update.title}</div>
              <div className="text-gray-500 text-sm">{update.summary}</div>
            </div>
            <button onClick={() => handleDelete(update._id)} className="text-red-500 ml-4" disabled={loading}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminMarketUpdates;
