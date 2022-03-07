// import './App.css';
import { useEffect, useState } from 'react';
import config from './Config';
import { useHistory, useLocation } from 'react-router-dom';

function MyForm() {
  const [row, setRow] = useState({});
 
  useEffect(()=>{
      (async ()=>{
        const obj = await (await fetch(config.MYFORM_API + `/1`)).json();
        console.log(obj);
        setRow(obj[0]);
      })();
  }, []);
  console.log(row);

  return (
    <div className="App">
        <div className="container">
        <div className="row"><div className="col-lg-6">
            <form>
                <div className="mb-3">
                    <label htmlFor="account" className="form-label">account</label>
                    <input type="text" className="form-control" disabled
                        value={row.account || ''}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="nickname" className="form-label">nickname</label>
                    <input type="text" className="form-control" id="nickname" name="nickname" value={row.nickname}/>
                </div>

                <div className="mb-3 form-check">
                    <input type="file" className="form-check-input" id="avatar" name="avatar"/>
                    <img src={config.IMG_PATH + '/' + (row.avatar || 'default.png')} alt=""/>
                </div>
                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>
        </div></div>
    </div>
  );
}
export default MyForm;
