import React, { useEffect, useState } from 'react';

const NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi'];
const ACTIONS = [
  name => `${name} just invested $${(Math.random()*5000+500).toFixed(0)} in Crypto Fund`,
  name => `${name} withdrew $${(Math.random()*2000+100).toFixed(0)}`,
  name => `${name} earned a profit of $${(Math.random()*1000+100).toFixed(0)}`,
  name => `${name} started a new investment plan`,
  name => `${name} received a referral bonus of $${(Math.random()*200+20).toFixed(0)}`
];

function randomActivity() {
  const name = NAMES[Math.floor(Math.random()*NAMES.length)];
  const action = ACTIONS[Math.floor(Math.random()*ACTIONS.length)];
  return { msg: action(name), time: new Date().toLocaleTimeString() };
}

export default function FakeUserActivity() {
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    setActivity([randomActivity(), randomActivity(), randomActivity()]);
    const interval = setInterval(() => {
      setActivity(a => [randomActivity(), ...a.slice(0, 9)]);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-4 mb-4">
      <div className="font-bold mb-2">Live User Activity</div>
      <ul className="text-sm space-y-1">
        {activity.map((a, i) => (
          <li key={i}><span className="text-gold">[{a.time}]</span> {a.msg}</li>
        ))}
      </ul>
    </div>
  );
}
