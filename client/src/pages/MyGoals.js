import React, { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiTarget, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

const initialGoals = [
  {
    id: 1,
    title: 'Save $10,000 for Investment',
    target: 10000,
    current: 3500,
    deadline: '2025-12-31',
    status: 'In Progress',
    color: 'from-green-400 to-blue-500',
  },
  {
    id: 2,
    title: 'Diversify Portfolio',
    target: 5,
    current: 3,
    deadline: '2025-09-30',
    status: 'In Progress',
    color: 'from-yellow-400 to-pink-500',
  },
];

export default function MyGoals() {
  const [goals, setGoals] = useState(initialGoals);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: '', deadline: '' });

  const handleAddGoal = () => {
    setGoals([
      ...goals,
      {
        id: Date.now(),
        title: newGoal.title,
        target: Number(newGoal.target),
        current: 0,
        deadline: newGoal.deadline,
        status: 'In Progress',
        color: 'from-purple-400 to-indigo-500',
      },
    ]);
    setShowAdd(false);
    setNewGoal({ title: '', target: '', deadline: '' });
  };

  const handleDelete = (id) => setGoals(goals.filter((g) => g.id !== id));

  return (
    <div className="w-full max-w-3xl mx-auto px-2 py-4 sm:px-4">
      <div className="flex flex-col sm:flex-row items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
        <FiTarget className="text-gold text-3xl mr-3" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gold-gradient text-center sm:text-left">My Goals</h1>
        <button
          className="w-full sm:w-auto bg-gold text-black px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:bg-yellow-400 transition"
          onClick={() => setShowAdd(true)}
        >
          <FiPlus /> Add Goal
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className={`glass-card p-4 sm:p-6 rounded-xl shadow-lg flex flex-col gap-2 sm:gap-3 border-l-8 bg-gradient-to-br ${goal.color}`}
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-center sm:text-left">
                <FiTrendingUp className="text-lg" /> {goal.title}
              </h2>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button className="text-blue-400 hover:text-blue-600"><FiEdit /></button>
                <button className="text-red-400 hover:text-red-600" onClick={() => handleDelete(goal.id)}><FiTrash2 /></button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mt-2 sm:mt-0">
              <div className="flex flex-col">
                <span className="text-sm text-gray-300">Target</span>
                <span className="font-bold text-base sm:text-lg">{goal.target} {goal.id === 2 ? 'Assets' : '$'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-300">Current</span>
                <span className="font-bold text-base sm:text-lg">{goal.current} {goal.id === 2 ? 'Assets' : '$'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-300">Deadline</span>
                <span className="font-bold text-base sm:text-lg">{goal.deadline}</span>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3 mt-2">
              <div
                className="h-2 sm:h-3 rounded-full bg-gradient-to-r from-gold to-yellow-400 transition-all duration-700"
                style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm sm:text-base">
              {goal.current >= goal.target ? (
                <span className="text-green-400 flex items-center gap-1"><FiCheckCircle /> Completed</span>
              ) : (
                <span className="text-yellow-300 flex items-center gap-1"><FiTrendingUp /> {goal.status}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Add Goal Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-2">
          <div className="bg-dark p-4 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-red-400" onClick={() => setShowAdd(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-gold">Add New Goal</h2>
            <input
              className="w-full mb-3 p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none text-sm sm:text-base"
              placeholder="Goal Title"
              value={newGoal.title}
              onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
            />
            <input
              className="w-full mb-3 p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none text-sm sm:text-base"
              placeholder="Target Amount or Number"
              type="number"
              value={newGoal.target}
              onChange={e => setNewGoal({ ...newGoal, target: e.target.value })}
            />
            <input
              className="w-full mb-3 p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none text-sm sm:text-base"
              placeholder="Deadline (YYYY-MM-DD)"
              type="date"
              value={newGoal.deadline}
              onChange={e => setNewGoal({ ...newGoal, deadline: e.target.value })}
            />
            <button
              className="w-full bg-gold text-black py-2 rounded-lg font-bold hover:bg-yellow-400 transition mt-2 text-sm sm:text-base"
              onClick={handleAddGoal}
              disabled={!newGoal.title || !newGoal.target || !newGoal.deadline}
            >
              Add Goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
