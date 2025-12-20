import { useRef, useCallback, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Draggable } from "gsap/all";

if (typeof window !== "undefined") {
    gsap.registerPlugin(useGSAP, Draggable);
}

/**
 * Reusable Horizontal Loop Hook
 * Wraps GSAP's horizontalLoop helper with React best practices.
 */
const useHorizontalLoop = (config = {}) => {
    const {
        itemSelector,
        speed = 1,
        paused = false,
        repeat = -1,
        // Optional: paddingRight/gap can be passed or calculated
        paddingRight = 0,
        snap = 1,
        draggable = true,
        // Custom fixed width/gap options if needed, otherwise calculates from elements
        itemWidth,
        gap = 0
    } = config;

    const containerRef = useRef(null);
    const loopRef = useRef(null);

    useGSAP(() => {
        const container = containerRef.current;
        if (!container || !itemSelector) return;

        const items = gsap.utils.toArray(container.querySelectorAll(itemSelector));
        if (!items.length) return;

        // 1. Set Initial Positions
        // 1. Set Initial Positions
        // Calculate width dynamically from the first item if not provided
        // This ensures the initial layout respects CSS width (e.g. 150px vs 100px)
        const elementWidth = itemWidth !== undefined ? itemWidth : (items[0].offsetWidth || 0);

        gsap.set(items, {
            x: (i) => i * (elementWidth + gap)
        });

        // 2. Define horizontalLoop helper
        const horizontalLoop = (items, config) => {
            items = gsap.utils.toArray(items);
            config = config || {};
            let tl = gsap.timeline({
                repeat: config.repeat,
                paused: config.paused,
                defaults: { ease: "none" },
                onReverseComplete: () =>
                    tl.totalTime(tl.rawTime() + tl.duration() * 100)
            }),
                length = items.length,
                startX = items[0].offsetLeft,
                times = [],
                widths = [],
                xPercents = [],
                curIndex = 0,
                pixelsPerSecond = (config.speed || 1) * 100,
                snap = config.snap === false ? (v) => v : gsap.utils.snap(config.snap || 1),
                populateWidths = () =>
                    items.forEach((el, i) => {
                        widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
                        xPercents[i] = snap(
                            (parseFloat(gsap.getProperty(el, "x", "px")) / widths[i]) * 100 +
                            gsap.getProperty(el, "xPercent")
                        );
                    }),
                getTotalWidth = () =>
                    items[length - 1].offsetLeft +
                    (xPercents[length - 1] / 100) * widths[length - 1] -
                    startX +
                    items[length - 1].offsetWidth *
                    gsap.getProperty(items[length - 1], "scaleX") +
                    (parseFloat(config.paddingRight) || 0),
                totalWidth,
                curX,
                distanceToStart,
                distanceToLoop,
                item,
                i;

            populateWidths();
            gsap.set(items, {
                xPercent: (i) => xPercents[i]
            });
            gsap.set(items, { x: 0 });
            totalWidth = getTotalWidth();

            for (i = 0; i < length; i++) {
                item = items[i];
                curX = (xPercents[i] / 100) * widths[i];
                distanceToStart = item.offsetLeft + curX - startX;
                distanceToLoop =
                    distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
                tl.to(
                    item,
                    {
                        xPercent: snap(((curX - distanceToLoop) / widths[i]) * 100),
                        duration: distanceToLoop / pixelsPerSecond
                    },
                    0
                )
                    .fromTo(
                        item,
                        {
                            xPercent: snap(
                                ((curX - distanceToLoop + totalWidth) / widths[i]) * 100
                            )
                        },
                        {
                            xPercent: xPercents[i],
                            duration:
                                (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond,
                            immediateRender: false
                        },
                        distanceToLoop / pixelsPerSecond
                    )
                    .add("label" + i, distanceToStart / pixelsPerSecond);
                times[i] = distanceToStart / pixelsPerSecond;
            }

            function toIndex(index, vars) {
                vars = vars || {};
                Math.abs(index - curIndex) > length / 2 &&
                    (index += index > curIndex ? -length : length);
                let newIndex = gsap.utils.wrap(0, length, index),
                    time = times[newIndex];
                if (time > tl.time() !== index > curIndex) {
                    vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
                    time += tl.duration() * (index > curIndex ? 1 : -1);
                }
                curIndex = newIndex;
                vars.overwrite = true;
                return tl.tweenTo(time, vars);
            }

            tl.next = (vars) => toIndex(curIndex + 1, vars);
            tl.previous = (vars) => toIndex(curIndex - 1, vars);
            tl.current = () => curIndex;
            tl.toIndex = (index, vars) => toIndex(index, vars);
            tl.updateIndex = () =>
                (curIndex = Math.round(tl.progress() * (items.length - 1)));
            tl.times = times;
            tl.progress(1, true).progress(0, true);

            if (config.reversed) {
                tl.vars.onReverseComplete();
                tl.reverse();
            }

            if (config.draggable && typeof Draggable === "function") {
                let proxy = document.createElement("div"),
                    wrap = gsap.utils.wrap(0, 1),
                    ratio,
                    startProgress,
                    draggable,
                    dragSnap,
                    roundFactor,
                    align = () =>
                        tl.progress(
                            wrap(startProgress + (draggable.startX - draggable.x) * ratio)
                        ),
                    syncIndex = () => tl.updateIndex();

                draggable = Draggable.create(proxy, {
                    trigger: container,
                    type: "x",
                    onPress() {
                        startProgress = tl.progress();
                        tl.progress(0);
                        populateWidths();
                        totalWidth = getTotalWidth();
                        ratio = 1 / totalWidth;
                        dragSnap = totalWidth / items.length;
                        roundFactor = Math.pow(
                            10,
                            ((dragSnap + "").split(".")[1] || "").length
                        );
                        tl.progress(startProgress);
                    },
                    onDrag: align,
                    onThrowUpdate: align,
                    inertia: false, // set true if inertia plugin exists
                    snap: (value) => {
                        let n =
                            Math.round(parseFloat(value) / dragSnap) * dragSnap * roundFactor;
                        return (n - (n % 1)) / roundFactor;
                    },
                    onRelease: syncIndex,
                    onThrowComplete: () => gsap.set(proxy, { x: 0 }) && syncIndex()
                })[0];
            }

            // Manual refresh method
            tl.refresh = () => {
                populateWidths();
                totalWidth = getTotalWidth();
            };

            return tl;
        };

        // 3. Initialize Loop
        loopRef.current = horizontalLoop(items, {
            speed,
            paused,
            repeat,
            // Gap logic: we must add paddingRight equal to gap so the last item spacing matches
            paddingRight: gap ? gap : paddingRight,
            snap,
            draggable
        });

        // 4. Resize Handler
        const handleResize = () => {
            if (loopRef.current && typeof loopRef.current.refresh === 'function') {
                const currentProgress = loopRef.current.progress();
                loopRef.current.progress(0);
                loopRef.current.refresh();
                loopRef.current.progress(currentProgress);
            }
        };
        window.addEventListener('resize', handleResize);

        // 5. Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (loopRef.current) loopRef.current.kill();
        };

    }, { scope: containerRef, dependencies: [itemSelector, speed, repeat, paddingRight, itemWidth, gap] });

    // Public API
    const pause = useCallback(() => loopRef.current?.pause(), []);
    const play = useCallback(() => loopRef.current?.play(), []);
    const next = useCallback((vars) => loopRef.current?.next(vars), []);
    const previous = useCallback((vars) => loopRef.current?.previous(vars), []);
    const toIndex = useCallback((i, vars) => loopRef.current?.toIndex(i, vars), []);

    return {
        containerRef,
        pause,
        play,
        next,
        previous,
        toIndex,
        loop: loopRef
    };
};

export default useHorizontalLoop;
