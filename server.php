<?php
/**
 * Date: 2020-03-16
 * @author Isaenko Alexey <info@oiplug.com>
 */

if ( ! empty( $_POST ) ) {
	$data = $_POST;
//	foreach ($data as $key=>$value){
//		if(is_array($value)){
//			$data[$key]=explode(',',$value);
//		}
//	}
	$data['answer'] = true;

	echo json_encode( $data, JSON_UNESCAPED_UNICODE );
//	print_r($data);
	die;
}

// eof
