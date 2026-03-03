import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ServerError: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
          500 – Server error
        </h1>
        <p className="text-slate-600 mb-6">
          Oops, something went wrong on our side. Our servers are temporarily unavailable or
          encountered an unexpected error.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Please try again in a few moments. If the problem persists, contact your administrator.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            Retry
          </button>
          <Link
            to="/"
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

