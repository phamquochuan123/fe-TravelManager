const Footer = () => {
    const year = new Date().getFullYear()
    return (
        <footer className='bg-dark text-light py-3 mt-5'>
            <div className='container text-center'>
                <p className='mb-0'>&copy; {year} LakeSide Hotel</p>
            </div>
        </footer>
    )
}

export default Footer
