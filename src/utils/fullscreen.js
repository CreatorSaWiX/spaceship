// Compatibilitat amb navegadors antics i Safari
export const enterFullscreen = (element) => {
    if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => console.warn(err));
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen(); // Safari antic
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen(); // IE/Edge legacy
    }
};

export const exitFullscreen = () => {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
};

export const getFullscreenElement = () => {
    return document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement;
};
