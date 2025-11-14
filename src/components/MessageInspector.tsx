import { useState } from 'react';
import { getMessageById } from '../utils/apiClient';
import type { Message } from '../types/api';

interface MessageInspectorProps {
  messages: Message[];
}

export function MessageInspector({ messages }: MessageInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageId, setMessageId] = useState('');
  const [messageData, setMessageData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    if (!messageId.trim()) {
      setError('Please enter a message ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessageData(null);

    try {
      const data = await getMessageById(messageId.trim());
      setMessageData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch message'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMessage = (msg: Message) => {
    setMessageId(msg.messageId);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-4 top-20 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 z-20"
      >
        {isOpen ? 'Hide' : 'Show'} Inspector
      </button>

      {isOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-30 overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Message Inspector
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Message ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageId}
                  onChange={(e) => setMessageId(e.target.value)}
                  placeholder="Paste message ID"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleLookup}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? 'Loading...' : 'Lookup'}
                </button>
              </div>
            </div>

            {messages.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recent Messages
                </label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {messages.slice(-10).reverse().map((msg, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectMessage(msg)}
                      className="w-full text-left px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 truncate"
                      title={msg.messageId}
                    >
                      {msg.messageId.substring(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            {messageData && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message Data
                </label>
                <pre className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto text-gray-800 dark:text-gray-200">
                  {JSON.stringify(messageData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}


