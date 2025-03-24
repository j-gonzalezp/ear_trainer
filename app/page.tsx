import React from 'react';
import Link from 'next/link';

interface TrainingCardProps {
  title: string;
  description: string;
  color: string;
  path: string;
}

const TrainingCard: React.FC<TrainingCardProps> = ({ title, description, color, path }) => (
  <Link href={path}>
    <div className={`rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer ${color}`}>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-700">{description}</p>
    </div>
  </Link>
);

const trainingTypes: TrainingCardProps[] = [
  {
    title: "Entrenamiento Básico",
    description: "Ejercicios fundamentales para entrenar tu oído musical.",
    color: "bg-blue-100 hover:bg-blue-200",
    path: "/basic"
  },
  {
    title: "Melodías",
    description: "Entrenamiento progresivo con 6 niveles de dificultad.",
    color: "bg-purple-100 hover:bg-purple-200",
    path: "/melodies"
  },
  {
    title: "Tríadas",
    description: "Reconocimiento de acordes y tríadas musicales.",
    color: "bg-green-100 hover:bg-green-200",
    path: "/triads"
  },
  {
    title: "Mixto",
    description: "Combinación de diferentes tipos de ejercicios.",
    color: "bg-yellow-100 hover:bg-yellow-200",
    path: "/mixed"
  },
  {
    title: "Sincrónico",
    description: "Ejercicios avanzados con sincronización musical.",
    color: "bg-red-100 hover:bg-red-200",
    path: "/synchronic"
  }
];

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Ear Trainer</h1>
          <p className="text-xl text-gray-600">Mejora tu oído musical con entrenamiento progresivo</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainingTypes.map((type, index) => (
            <TrainingCard key={index} {...type} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
