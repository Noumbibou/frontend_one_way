import React, {useEffect, useState} from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function CampaignList(){
  const [campaigns, setCampaigns] = useState([]);
  useEffect(()=> {
    api.get('campaigns/').then(r=>setCampaigns(r.data.results || r.data)).catch(()=>setCampaigns([]));
  },[]);
  return (
    <div>
      <h1>Campaigns</h1>
      <ul>
        {campaigns.map(c=>(
          <li key={c.id}>
            <Link to={`/recruiter/campaigns/${c.id}`}>{c.title}</Link>
            <div>{c.start_date} — {c.end_date}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}