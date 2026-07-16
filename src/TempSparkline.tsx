/*
 * SPDX-License-Identifier: LGPL-2.1-or-later
 *
 * Minimal inline-SVG line chart for temp_history_24h (144 points, 10min
 * apart, oldest first). A value of 0 means the disk was in standby at that
 * sample, so those points are treated as gaps rather than 0°C readings.
 *
 * The min/max labels are plain HTML text immediately above/below the chart,
 * not SVG <text>: the chart uses preserveAspectRatio="none" to stretch and
 * fill whatever width its container ends up being, and stretching text
 * along with it distorts the glyphs whenever the rendered aspect ratio
 * doesn't match the viewBox's. Lines don't show that distortion, text does.
 */

import React from 'react';

import cockpit from 'cockpit';

const _ = cockpit.gettext;

const WIDTH = 136;
const HEIGHT = 24;
const PAD = 2;

export const TempSparkline = ({ history }: { history: number[] }) => {
    const known = history.filter(v => v > 0);
    if (known.length < 2)
        return null;

    const min = Math.min(...known);
    const max = Math.max(...known);
    const range = Math.max(1, max - min);

    const points: string[] = [];
    let segment: string[] = [];
    const segments: string[][] = [];

    history.forEach((v, i) => {
        if (v <= 0) {
            if (segment.length)
                segments.push(segment);
            segment = [];
            return;
        }
        const x = (i / (history.length - 1)) * WIDTH;
        const y = HEIGHT - PAD - ((v - min) / range) * (HEIGHT - 2 * PAD);
        segment.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    });
    if (segment.length)
        segments.push(segment);
    segments.forEach(s => points.push(s.join(' ')));

    return (
        <div>
            <div className="snapraid-temp-sparkline-label">{ cockpit.format(_("$0°"), Math.round(max)) }</div>
            <svg
                viewBox={ `0 0 ${WIDTH} ${HEIGHT}` }
                preserveAspectRatio="none"
                className="snapraid-temp-sparkline"
                role="img"
                aria-label={ cockpit.format(_("Temperature over the last 24 hours, $0°C to $1°C"), min, max) }
            >
                <title>{ cockpit.format(_("Last 24h: $0°C to $1°C"), min, max) }</title>

                <line
                    x1="0" y1={ PAD } x2={ WIDTH } y2={ PAD }
                    stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.35"
                />
                <line
                    x1="0" y1={ HEIGHT - PAD } x2={ WIDTH } y2={ HEIGHT - PAD }
                    stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.35"
                />

                { points.map((p, i) => (
                    <polyline key={ i } points={ p } fill="none" stroke="currentColor" strokeWidth="1.5" />
                )) }
            </svg>
            <div className="snapraid-temp-sparkline-label">{ cockpit.format(_("$0°"), Math.round(min)) }</div>
        </div>
    );
};
