import "./layout.css"

export const Layout = ({
    children,
    isLandingPage = false,
    onNext,
    nextButtonText
}) => {
    return (
        <div className="ui-layout">
            <main className="ui-layout-main">
                {children}
            </main>
            {isLandingPage && (
                <footer className="ui-layout-footer">
                    <button
                        className="ui-layout-next-button"
                        onClick={onNext}
                    >
                        {nextButtonText}
                    </button>
                </footer>
            )}
        </div>
    )
} 