import React from 'react';

export default function Pagination({ meta, onPageChange }) {
    if (!meta || meta.last_page <= 1) {
        return null;
    }

    const { current_page, last_page, links, from, to, total } = meta;

    const getPageClasses = (isActive, isDisabled) => {
        let classes = "px-3 py-2 border rounded-md text-sm ";
        if (isDisabled) {
            classes += "bg-gray-100 text-gray-400 cursor-not-allowed";
        } else if (isActive) {
            classes += "bg-indigo-600 text-white border-indigo-600";
        } else {
            classes += "bg-white text-gray-700 hover:bg-gray-50 border-gray-300";
        }
        return classes;
    };

    const handlePageClick = (url, isActive, isDisabled) => {
        if (url && !isActive && !isDisabled && onPageChange) {
            onPageChange(url);
        }
    };

    return (
        <div className="flex flex-col items-center justify-between gap-4 mt-6 md:flex-row">
            <div className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{from || 0}</span> à <span className="font-medium">{to || 0}</span> sur <span className="font-medium">{total}</span> résultats
            </div>
            
            <nav className="inline-flex rounded-md shadow-sm">
                <ul className="flex list-none">
                    {links.map((link, index) => {
                        const isActive = link.active;
                        const isDisabled = !link.url;
                        
                        return (
                            <li key={index}>
                                <button
                                    onClick={() => handlePageClick(link.url, isActive, isDisabled)}
                                    disabled={isDisabled}
                                    className={getPageClasses(isActive, isDisabled)}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
