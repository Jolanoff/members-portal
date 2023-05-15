import React from 'react'
import Pagination from "react-js-pagination";
import {FaArrowLeft, FaArrowRight, FaAngleDoubleRight, FaAngleDoubleLeft} from 'react-icons/fa'


const PaginationTool = ({ dataPerpage, totalData, paginate, currentPage }) => {
    const pageNumber = [];


    for (let i = 1; i <= Math.ceil(totalData / dataPerpage); i++) {
        pageNumber.push(i);
    }

    return (

        <Pagination
            innerClass="flex justify-center mt-8"
            linkClass="mx-1 flex h-9 w-9 items-center justify-center rounded-full border border-blue-gray-100 bg-blue p-0 text-sm"
            itemClass="text-blue-gray-500 hover:bg-light-300"
            activeLinkClass="text-white bg-blue-500 hover:bg-blue-600"
            prevPageText={<FaArrowLeft className='text-gray-500'/>}
            lastPageText={<FaAngleDoubleRight className='text-gray-500'/>}
            firstPageText={<FaAngleDoubleLeft className='text-gray-500'/>}
            nextPageText={<FaArrowRight className='text-gray-500'/>}
            activePage={currentPage}
            itemsCountPerPage={dataPerpage}
            totalItemsCount={totalData}
            pageRangeDisplayed={5}
            onChange={paginate}
        />
    );


}

export default PaginationTool