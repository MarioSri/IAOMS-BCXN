import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, MapPin, Eye, Zap } from 'lucide-react';
import { SignatureZone } from '@/services/aiSignaturePlacement';

interface SignaturePlacementPreviewProps {
  zones: SignatureZone[];
  selectedZone: string | null;
  onZoneSelect: (zoneId: string) => void;
  documentTitle: string;
}

export const SignaturePlacementPreview: React.FC<SignaturePlacementPreviewProps> = ({
  zones,
  selectedZone,
  onZoneSelect,
  documentTitle
}) => {
  const getZoneColor = (zone: SignatureZone) => {
    if (zone.id === selectedZone) return '#3b82f6'; // Blue for selected
    if (zone.confidence > 0.9) return '#10b981'; // Green for high confidence
    if (zone.confidence > 0.8) return '#f59e0b'; // Yellow for medium confidence
    return '#6b7280'; // Gray for low confidence
  };

  const getZoneTypeIcon = (type: SignatureZone['type']) => {
    switch (type) {
      case 'text_pattern': return '📝';
      case 'coordinate_based': return '📍';
      case 'template_based': return '📋';
      case 'whitespace_detection': return '⬜';
      default: return '📄';
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          Signature Placement Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Preview Area */}
        <div className="relative bg-white border-2 border-gray-200 rounded-lg p-4 min-h-[400px] overflow-hidden">
          {/* Document Header */}
          <div className="text-center mb-6 pb-4 border-b border-gray-200">
            <h3 className="font-bold text-lg">{documentTitle}</h3>
            <p className="text-sm text-gray-600 mt-2">
              INSTITUTIONAL ACADEMIC OPERATIONS MANAGEMENT SYSTEM
            </p>
          </div>
          
          {/* Document Content Area */}
          <div className="space-y-4 text-sm text-gray-700">
            <p>This document requires digital signature for approval and processing...</p>
            <div className="grid grid-cols-2 gap-4 my-6">
              <div>
                <strong>Document Type:</strong> Official Letter
              </div>
              <div>
                <strong>Priority:</strong> High
              </div>
            </div>
            <p>Please review the content and provide your digital signature below:</p>
          </div>
          
          {/* Signature Zones Overlay */}
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="absolute border-2 border-dashed cursor-pointer transition-all duration-200 hover:shadow-lg"
              style={{
                left: `${(zone.x / 600) * 100}%`,
                top: `${(zone.y / 800) * 100}%`,
                width: `${(zone.width / 600) * 100}%`,
                height: `${(zone.height / 800) * 100}%`,
                borderColor: getZoneColor(zone),
                backgroundColor: `${getZoneColor(zone)}20`,
                zIndex: zone.id === selectedZone ? 10 : 5
              }}
              onClick={() => onZoneSelect(zone.id)}
            >
              {/* Zone Label */}
              <div 
                className="absolute -top-6 left-0 px-2 py-1 rounded text-xs font-medium text-white shadow-sm"
                style={{ backgroundColor: getZoneColor(zone) }}
              >
                {getZoneTypeIcon(zone.type)} {Math.round(zone.confidence * 100)}%
              </div>
              
              {/* Zone Content */}
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Target className="w-4 h-4 mx-auto mb-1" style={{ color: getZoneColor(zone) }} />
                  <div className="text-xs font-medium" style={{ color: getZoneColor(zone) }}>
                    Signature Zone
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Footer Area */}
          <div className="absolute bottom-4 left-4 right-4 border-t border-gray-200 pt-4">
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <strong>Authorized Signatory:</strong>
                <br />Name: _________________
                <br />Date: _________________
              </div>
              <div>
                <strong>Digital Signature:</strong>
                <br />Certificate: Valid
                <br />Timestamp: Auto-generated
              </div>
            </div>
          </div>
        </div>
        
        {/* Zone Selection Panel */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Available Signature Zones:</div>
          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
            {zones.map((zone) => (
              <Button
                key={zone.id}
                variant={zone.id === selectedZone ? 'default' : 'outline'}
                size="sm"
                onClick={() => onZoneSelect(zone.id)}
                className="justify-start h-auto p-2"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span>{getZoneTypeIcon(zone.type)}</span>
                    <span className="text-xs">{zone.description}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs">
                      {Math.round(zone.confidence * 100)}%
                    </Badge>
                    {zone.legalCompliance && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        ✓
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
        
        {/* AI Insights */}
        {selectedZone && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">AI Placement Insights</span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              {(() => {
                const zone = zones.find(z => z.id === selectedZone);
                if (!zone) return null;
                
                return (
                  <>
                    <div>• Confidence Level: {Math.round(zone.confidence * 100)}% (AI-verified optimal placement)</div>
                    <div>• Detection Method: {zone.type.replace('_', ' ').toUpperCase()}</div>
                    <div>• Legal Compliance: {zone.legalCompliance ? 'Verified ✓' : 'Needs Review ⚠️'}</div>
                    <div>• Positioning: Optimized for institutional document standards</div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};