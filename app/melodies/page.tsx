"use client"

import React from 'react';
import Link from 'next/link';

const LevelCard = ({ level, color, groups, progress }) => {
  const progressPercentage = Math.round((progress.completed / progress.total) * 100);
  
  return (
    <Link href={`/melodies/${level}`}>
      <div className={`rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer ${color} p-6`}>
        <h3 className="text-2xl font-bold mb-3">Nivel {level}</h3>
        <div className="mb-4">
          <p className="text-gray-700 mb-1">{groups} grupos de ejercicios</p>
          <p className="text-gray-700 mb-1">Permutaciones de {level + 1} entre 7 números (1-7)</p>
        </div>
        <div className="mt-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-semibold">Progreso</span>
            <span className="text-sm">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-600">
            <span>{progress.completed} completados</span>
            <span>{progress.total} total</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function MelodiesPage() {
  const levels = [
    { 
      level: 1, 
      color: 'bg-green-100', 
      groups: 21,
      progress: { completed: 12, total: 21 } 
    },
    { 
      level: 2, 
      color: 'bg-blue-100', 
      groups: 35,
      progress: { completed: 8, total: 35 } 
    },
    { 
      level: 3, 
      color: 'bg-purple-100', 
      groups: 35,
      progress: { completed: 5, total: 35 } 
    },
    { 
      level: 4, 
      color: 'bg-yellow-100', 
      groups: 21,
      progress: { completed: 2, total: 21 } 
    },
    { 
      level: 5, 
      color: 'bg-orange-100', 
      groups: 7,
      progress: { completed: 0, total: 7 } 
    },
    { 
      level: 6, 
      color: 'bg-red-100', 
      groups: 1,
      progress: { completed: 0, total: 1 } 
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12">
          <div className="flex items-center mb-6">
            <Link href="/">
              <div className="mr-4 text-gray-600 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">Entrenamiento de Melodías</h1>
          </div>
          <p className="text-lg text-gray-600">Selecciona un nivel para comenzar los ejercicios</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levels.map((level) => (
            <LevelCard key={level.level} {...level} />
          ))}
        </div>
      </div>
    </div>
  );
}