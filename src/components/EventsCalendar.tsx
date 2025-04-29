
import React from 'react';

export const EventsCalendar = () => {
  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-xl font-semibold mb-6 text-purple-700">Wydarzenia</h2>
      <div className="w-full max-w-4xl mx-auto overflow-hidden border-2 border-purple-200 rounded-md shadow-md bg-purple-50">
        <div className="relative pb-[75%] h-0 w-full">
          <iframe
            src="https://lu.ma/embed/calendar/cal-qWfKnOIZRLfAqq1/events"
            width="100%"
            height="100%"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%', 
              height: '100%',
              border: '1px solid #bfcbda88', 
              borderRadius: '4px' 
            }}
            frameBorder="0"
            allowFullScreen
            title="Rotary Club Szczecin Events Calendar"
          ></iframe>
        </div>
      </div>
    </div>
  );
};
