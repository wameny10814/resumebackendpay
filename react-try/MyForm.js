// import './App.css';
import { useEffect, useState } from 'react';
import config from './Config';
import { useHistory, useLocation } from 'react-router-dom';

function MyForm() {
  const [row, setRow] = useState({});
  const API = config.MYFORM_API + `/1`;
 
  useEffect(()=>{
      (async ()=>{
        const obj = await (await fetch(API)).json();
        console.log(obj);
        setRow(obj[0]);
      })();
  }, []);
  console.log(row);

  const whenChangedAvatar = event=>{
    console.log(event.target.files[0]);

    const reader = new FileReader();
    reader.onload = function(event){
        document.querySelector('#myImg').src = reader.result;

    };
    reader.readAsDataURL(event.target.files[0]); // 讀取資料
  };

  const whenSubmit = async (event)=>{
    event.preventDefault(); // 避免傳統方式送出表單

    const fd = new FormData(document.form1);

    const r = await fetch(API, {
        method: 'PUT',
        body: fd,
    });
    const obj = await r.json();

    console.log(obj);
  };

  return (
    <div className="App">
        <div className="container">
        <div className="row"><div className="col-lg-6">
            <form name="form1" onSubmit={whenSubmit}>
                <div className="mb-3">
                    <label htmlFor="account" className="form-label">account</label>
                    <input type="text" className="form-control" disabled
                        value={row.account || ''}
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="nickname" className="form-label">nickname</label>
                    <input type="text" className="form-control" id="nickname" name="nickname" defaultValue={row.nickname}/>
                </div>
                <div className="input-group">
                    <input type="file" className="form-control" id="avatar" name="avatar" 
                    onChange={whenChangedAvatar} aria-describedby="inputGroupFileAddon04" aria-label="Upload" />
                </div>
                <div className="input-group">
                    <img src={config.IMG_PATH + '/' + (row.avatar || 'default.jpg')} alt="" id="myImg" style={{maxWidth: '200px'}}/>
                </div>

                <button type="submit" className="btn btn-primary">Submit</button>
            </form>
        </div>
        </div></div>
    </div>
  );
}
export default MyForm;
