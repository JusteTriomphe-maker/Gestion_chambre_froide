import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export function StockEvolutionChart({ entriesData, exitsData }) {
    const data = {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [
            {
                label: 'Entrées Stock',
                data: entriesData || Array(12).fill(0),
                borderColor: 'rgb(34, 197, 94)',
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                tension: 0.3,
            },
            {
                label: 'Sorties Stock',
                data: exitsData || Array(12).fill(0),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                tension: 0.3,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Évolution des Mouvements de Stock',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return <Line options={options} data={data} />;
}

export function ProductCategoryChart({ categories, counts }) {
    const data = {
        labels: categories || ['Aucune donnée'],
        datasets: [
            {
                data: counts || [1],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(20, 184, 166, 0.8)',
                ],
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
            title: {
                display: true,
                text: 'Produits par Catégorie',
            },
        },
    };

    return <Doughnut options={options} data={data} />;
}

export function MonthlyRevenueChart({ months, revenues, expenses }) {
    const data = {
        labels: months || ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [
            {
                label: 'Revenus (Ventes)',
                data: revenues || Array(6).fill(0),
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
            },
            {
                label: 'Dépenses (Achats)',
                data: expenses || Array(6).fill(0),
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Revenus vs Dépenses',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
            },
        },
    };

    return <Bar options={options} data={data} />;
}

export function TopProductsChart({ products, quantities }) {
    const data = {
        labels: products || ['Aucun produit'],
        datasets: [
            {
                label: 'Quantité Vendue',
                data: quantities || [0],
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: true,
                text: 'Top 5 Produits les Plus Vendus',
            },
        },
        scales: {
            x: {
                beginAtZero: true,
            },
        },
    };

    return <Bar options={options} data={data} />;
}
